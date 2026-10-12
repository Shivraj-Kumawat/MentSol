import { useEffect, useRef, useMemo } from 'react';
import { useDevicePerformance } from '@/hooks/useDevicePerformance';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

interface ParticleBackgroundProps {
  particleCount?: number;
  className?: string;
}

export const ParticleBackground = ({ 
  particleCount = 50, 
  className = "" 
}: ParticleBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const lastFrameTime = useRef<number>(0);
  const { isLowPerformance, isMobile, prefersReducedMotion } = useDevicePerformance();

  // Adjust particle count based on device performance
  const adjustedParticleCount = useMemo(() => {
    if (prefersReducedMotion) return 0;
    if (isLowPerformance) return Math.min(12, particleCount);
    if (isMobile) return Math.min(20, particleCount);
    return particleCount;
  }, [particleCount, isLowPerformance, isMobile, prefersReducedMotion]);

  // Target FPS: 30 for mobile, 60 for desktop
  const targetFPS = isMobile ? 30 : 60;
  const frameInterval = 1000 / targetFPS;

  useEffect(() => {
    // Skip rendering entirely if reduced motion is preferred
    if (prefersReducedMotion || adjustedParticleCount === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap DPR for performance
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles with reduced velocity for mobile
    const speedMultiplier = isMobile ? 0.3 : 0.5;
    particlesRef.current = Array.from({ length: adjustedParticleCount }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      size: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * speedMultiplier,
      speedY: (Math.random() - 0.5) * speedMultiplier,
      opacity: Math.random() * 0.4 + 0.2,
    }));

    const animate = (currentTime: number) => {
      // Throttle frame rate
      const elapsed = currentTime - lastFrameTime.current;
      if (elapsed < frameInterval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime.current = currentTime - (elapsed % frameInterval);

      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      particlesRef.current.forEach((particle) => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.offsetWidth;
        if (particle.x > canvas.offsetWidth) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.offsetHeight;
        if (particle.y > canvas.offsetHeight) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(176, 100%, 40%, ${particle.opacity})`;
        ctx.fill();
      });

      // Only draw connections on desktop (skip O(n²) on mobile)
      if (!isMobile && !isLowPerformance) {
        const connectionDistance = 80;
        particlesRef.current.forEach((p1, i) => {
          // Limit connections to nearby particles only
          for (let j = i + 1; j < Math.min(i + 10, particlesRef.current.length); j++) {
            const p2 = particlesRef.current[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < connectionDistance) {
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `hsla(176, 100%, 40%, ${0.08 * (1 - distance / connectionDistance)})`;
              ctx.stroke();
            }
          }
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [adjustedParticleCount, isMobile, isLowPerformance, prefersReducedMotion, frameInterval]);

  // Early return AFTER all hooks - the useEffect already handles prefersReducedMotion internally
  if (prefersReducedMotion || adjustedParticleCount === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ 
        width: '100%', 
        height: '100%',
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
    />
  );
};
