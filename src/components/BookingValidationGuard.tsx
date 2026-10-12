/**
 * BookingValidationGuard - Prevents booking if mentor is not bookable
 * Shows clear error states instead of allowing invalid bookings
 */

import { AlertCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export type BookingBlockReason = 
  | 'MENTOR_NOT_APPROVED'
  | 'PRICING_NOT_SET'
  | 'NO_AVAILABILITY'
  | 'MENTOR_SUSPENDED';

interface BookingValidationGuardProps {
  reason: BookingBlockReason;
  mentorName?: string;
  onGoBack?: () => void;
}

export function BookingValidationGuard({ reason, mentorName, onGoBack }: BookingValidationGuardProps) {
  const navigate = useNavigate();
  
  const getContent = () => {
    switch (reason) {
      case 'MENTOR_NOT_APPROVED':
        return {
          icon: <Clock className="h-12 w-12 text-amber-500 mx-auto" />,
          title: 'Mentor Not Available Yet',
          description: `${mentorName || 'This mentor'} is still being verified by our team. Please check back later or explore other mentors.`,
          action: 'Browse Other Mentors',
          actionRoute: '/home',
        };
      
      case 'PRICING_NOT_SET':
        return {
          icon: <DollarSign className="h-12 w-12 text-amber-500 mx-auto" />,
          title: 'Pricing Not Configured',
          description: `${mentorName || 'This mentor'} hasn't set up their pricing yet. Please check back later or contact support.`,
          action: 'Contact Support',
          actionRoute: '/contact-support',
        };
      
      case 'NO_AVAILABILITY':
        return {
          icon: <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />,
          title: 'No Available Slots',
          description: `${mentorName || 'This mentor'} hasn't added any availability slots yet. Try again later or explore other mentors.`,
          action: 'Browse Other Mentors',
          actionRoute: '/home',
        };
      
      case 'MENTOR_SUSPENDED':
        return {
          icon: <XCircle className="h-12 w-12 text-destructive mx-auto" />,
          title: 'Mentor Unavailable',
          description: 'This mentor is currently unavailable for bookings. Please explore other mentors.',
          action: 'Browse Other Mentors',
          actionRoute: '/home',
        };
      
      default:
        return {
          icon: <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />,
          title: 'Cannot Book Session',
          description: 'Unable to book a session at this time. Please try again later.',
          action: 'Go Back',
          actionRoute: null,
        };
    }
  };
  
  const content = getContent();
  
  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader className="text-center">
        {content.icon}
        <CardTitle className="mt-4">{content.title}</CardTitle>
        <CardDescription>{content.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button
          onClick={() => {
            if (content.actionRoute) {
              navigate(content.actionRoute);
            } else if (onGoBack) {
              onGoBack();
            } else {
          navigate("/home", { replace: true });
            }
          }}
        >
          {content.action}
        </Button>
        <Button variant="ghost" onClick={() => {
          if (onGoBack) {
            onGoBack();
          } else {
            navigate("/home", { replace: true });
          }
        }}>
          Go Back
        </Button>
      </CardContent>
    </Card>
  );
}
