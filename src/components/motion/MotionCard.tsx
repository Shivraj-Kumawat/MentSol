import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { motionConfig, gentleSpring } from '@/lib/motion';
import { useDevicePerformance } from '@/hooks/useDevicePerformance';
import { cn } from '@/lib/utils';

interface MotionCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  enableHover?: boolean;
  enableTap?: boolean;
}

export const MotionCard = ({ 
  children, 
  className, 
  onClick,
  enableHover = true,
  enableTap = true,
}: MotionCardProps) => {
  const { prefersReducedMotion, isMobile } = useDevicePerformance();

  if (prefersReducedMotion) {
    return (
      <div className={className} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={motionConfig.fadeInUp.initial}
      animate={motionConfig.fadeInUp.animate}
      transition={motionConfig.fadeInUpTransition}
      whileHover={enableHover && !isMobile ? motionConfig.hoverLift : undefined}
      whileTap={enableTap ? motionConfig.tap : undefined}
      className={cn("cursor-pointer", className)}
      onClick={onClick}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
};
