import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, URLOpenListenerEvent } from '@capacitor/app';

/**
 * Handles deep linking for the mobile app.
 * Routes deep link URLs to appropriate pages.
 * NO magic link or OTP authentication - email+password only.
 */
export const useDeepLinking = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let listenerHandle: any = null;

    const handleDeepLink = async (event: URLOpenListenerEvent) => {
      const url = event.url;
      console.log('Deep link received:', url);

      try {
        const urlObj = new URL(url);
        
        // Extract the path and navigate
        // Handle referral links, mentor profiles, etc.
        const path = urlObj.pathname + urlObj.search;
        
        // Handle partner referral links
        if (path.startsWith('/ref/') || path.startsWith('/partner/')) {
          navigate(path);
          return;
        }

        // Handle mentor profile links
        if (path.startsWith('/mentor/')) {
          navigate(path);
          return;
        }

        // Default navigation
        if (path && path !== '/') {
          navigate(path);
        } else {
          navigate('/home');
        }
      } catch (error) {
        console.error('Error parsing deep link:', error);
        navigate('/home');
      }
    };

    const setupListener = async () => {
      listenerHandle = await App.addListener('appUrlOpen', handleDeepLink);

      const launchUrl = await App.getLaunchUrl();
      if (launchUrl?.url) {
        handleDeepLink({ url: launchUrl.url });
      }
    };

    setupListener();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [navigate]);
};
