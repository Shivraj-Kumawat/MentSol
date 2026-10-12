import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ReactNode, useRef } from 'react';
import { useDevicePerformance } from '@/hooks/useDevicePerformance';

interface Premium3DCardProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  glowColor?: string;
  onClick?: () => void;
}

export const Premium3DCard = ({
  children,
  className = '',
  disabled = false,
  glowColor = 'hsl(var(--primary))',
  onClick,
}: Premium3DCardProps) => {
  const { prefersReducedMotion, isMobile } = useDevicePerformance();
  const ref = useRef<HTMLDivElement>(null);

  // Mouse position values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring config for smooth movement
  const springConfig = { stiffness: 300, damping: 30 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [3, -3]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-3, 3]), springConfig);

  // Shine effect position
  const shineX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), springConfig);
  const shineY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), springConfig);

  // Shadow position transforms - MUST be at top level (not inside JSX)
  const shadowX = useTransform(rotateY, [-3, 3], [-8, 8]);
  const shadowY = useTransform(rotateX, [-3, 3], [8, -8]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || isMobile || disabled) return;
    
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Normalize to -0.5 to 0.5
    mouseX.set((e.clientX - centerX) / rect.width);
    mouseY.set((e.clientY - centerY) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // For reduced motion or mobile, return static card
  if (prefersReducedMotion) {
    return (
      <div className={className} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      style={{
        perspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        style={{
          rotateX: isMobile ? 0 : rotateX,
          rotateY: isMobile ? 0 : rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full h-full"
      >
        {/* Main content */}
        {children}
        
        {/* Subtle shine overlay - only on desktop */}
        {!isMobile && !disabled && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at ${shineX}% ${shineY}%, ${glowColor.replace(')', ' / 0.15)')}, transparent 50%)`,
            }}
          />
        )}
      </motion.div>
      
      {/* Dynamic shadow based on tilt */}
      {!isMobile && !disabled && (
        <motion.div
          className="absolute inset-0 -z-10 rounded-[inherit] blur-xl opacity-20"
          style={{
            background: glowColor,
            x: shadowX,
            y: shadowY,
            scale: 0.9,
          }}
        />
      )}
    </motion.div>
  );
};

export default Premium3DCard;
