import { useState, useRef } from 'react';
import { cn } from "@/lib/utils";

interface FloatingCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: number;
}

export const FloatingCard = ({ 
  children, 
  className,
  glowColor = "hsl(176 100% 40%)",
  intensity = 15
}: FloatingCardProps) => {
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const rotateX = ((e.clientY - centerY) / (rect.height / 2)) * -intensity;
    const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * intensity;
    
    setTransform({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setTransform({ rotateX: 0, rotateY: 0 });
    setIsHovered(false);
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative transition-all duration-300 ease-out",
        className
      )}
      style={{
        transform: `perspective(1000px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg)`,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Glow effect */}
      <div 
        className="absolute -inset-1 rounded-2xl opacity-0 transition-opacity duration-300 blur-xl"
        style={{
          background: glowColor,
          opacity: isHovered ? 0.3 : 0,
        }}
      />
      
      {/* Shine effect */}
      <div 
        className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
        style={{
          background: isHovered 
            ? `linear-gradient(${105 + transform.rotateY * 2}deg, transparent 40%, hsla(0, 0%, 100%, 0.1) 50%, transparent 60%)`
            : 'transparent',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
