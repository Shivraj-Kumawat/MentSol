import { ReactNode } from 'react';
import { Card, CardProps } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface GlowCardProps extends CardProps {
  children: ReactNode;
  glowColor?: 'primary' | 'accent' | 'purple' | 'orange';
  enableHover?: boolean;
}

export const GlowCard = ({
  children,
  className,
  glowColor = 'primary',
  enableHover = true,
  ...props
}: GlowCardProps) => {
  const glowClasses = {
    primary: 'hover:shadow-[0_0_30px_hsl(176_100%_40%/0.15)]',
    accent: 'hover:shadow-[0_0_30px_hsl(176_100%_40%/0.2)]',
    purple: 'hover:shadow-[0_0_30px_hsl(280_82%_60%/0.15)]',
    orange: 'hover:shadow-[0_0_30px_hsl(24_95%_53%/0.15)]',
  };

  return (
    <Card
      className={cn(
        'transition-all duration-300',
        enableHover && [
          'hover:-translate-y-0.5',
          glowClasses[glowColor],
        ],
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
};
