import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const SessionExpiryWarning = () => {
  const { getSessionExpiryTime, refreshSession } = useAuth();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const checkExpiry = setInterval(() => {
      const expiryTime = getSessionExpiryTime();
      if (!expiryTime) return;

      const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
      
      if (expiryTime < fiveMinutesFromNow && !showWarning) {
        setShowWarning(true);
        toast.warning('Your session will expire soon', {
          description: 'Click to stay logged in',
          duration: 60000,
          action: {
            label: 'Stay Logged In',
            onClick: async () => {
              const success = await refreshSession();
              if (success) {
                toast.success('Session refreshed successfully');
                setShowWarning(false);
              } else {
                toast.error('Failed to refresh session. Please login again.');
              }
            },
          },
        });
      } else if (expiryTime > fiveMinutesFromNow) {
        setShowWarning(false);
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkExpiry);
  }, [getSessionExpiryTime, refreshSession, showWarning]);

  return null;
};
