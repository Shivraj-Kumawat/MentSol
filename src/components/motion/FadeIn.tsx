import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { motionConfig } from '@/lib/motion';
import { useDevicePerformance } from '@/hooks/useDevicePerformance';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export const FadeIn = ({ children, delay = 0, className }: FadeInProps) => {
  const { prefersReducedMotion } = useDevicePerformance();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={motionConfig.fadeInUp.initial}
      animate={motionConfig.fadeInUp.animate}
      transition={{ ...motionConfig.fadeInUpTransition, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
