import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { useDevicePerformance } from '@/hooks/useDevicePerformance';
import { iosEasing } from '@/lib/motion';

interface EntranceAnimationProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale';
  distance?: number;
}

export const EntranceAnimation = ({
  children,
  className,
  delay = 0,
  direction = 'up',
  distance = 12,
}: EntranceAnimationProps) => {
  const { prefersReducedMotion } = useDevicePerformance();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const getInitialProps = () => {
    switch (direction) {
      case 'up':
        return { opacity: 0, y: distance };
      case 'down':
        return { opacity: 0, y: -distance };
      case 'left':
        return { opacity: 0, x: distance };
      case 'right':
        return { opacity: 0, x: -distance };
      case 'scale':
        return { opacity: 0, scale: 0.95 };
      default:
        return { opacity: 0, y: distance };
    }
  };

  const getAnimateProps = () => {
    switch (direction) {
      case 'up':
      case 'down':
        return { opacity: 1, y: 0 };
      case 'left':
      case 'right':
        return { opacity: 1, x: 0 };
      case 'scale':
        return { opacity: 1, scale: 1 };
      default:
        return { opacity: 1, y: 0 };
    }
  };

  return (
    <motion.div
      initial={getInitialProps()}
      animate={getAnimateProps()}
      transition={{
        duration: 0.4,
        delay,
        ease: iosEasing,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
