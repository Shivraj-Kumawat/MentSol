import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { motionConfig } from '@/lib/motion';
import { useDevicePerformance } from '@/hooks/useDevicePerformance';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export const PageTransition = ({ children, className }: PageTransitionProps) => {
  const { prefersReducedMotion } = useDevicePerformance();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={motionConfig.page.initial}
      animate={motionConfig.page.animate}
      exit={motionConfig.page.exit}
      transition={motionConfig.pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
};
