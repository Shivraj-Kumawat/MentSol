import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { useDevicePerformance } from '@/hooks/useDevicePerformance';

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
}

export const StaggerContainer = ({ children, className }: StaggerContainerProps) => {
  const { prefersReducedMotion } = useDevicePerformance();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export const StaggerItem = ({ children, className }: StaggerItemProps) => {
  const { prefersReducedMotion } = useDevicePerformance();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
};
