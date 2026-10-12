import { useState, useEffect } from 'react';

interface DevicePerformance {
  isIOS: boolean;
  isMobile: boolean;
  isLowPerformance: boolean;
  prefersReducedMotion: boolean;
}

/**
 * DEFENSIVE: Safe browser environment checks
 * These prevent crashes on Safari, iOS WebView, and SSR
 */
const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

const hasNavigator = (): boolean => {
  return typeof navigator !== 'undefined';
};

export function useDevicePerformance(): DevicePerformance {
  const [performance, setPerformance] = useState<DevicePerformance>({
    isIOS: false,
    isMobile: false,
    isLowPerformance: false,
    prefersReducedMotion: false,
  });

  useEffect(() => {
    // DEFENSIVE: All browser APIs wrapped in typeof checks
    if (!isBrowser() || !hasNavigator()) {
      return;
    }
    
    // DEFENSIVE: Safe access to navigator properties with fallbacks
    const userAgent = navigator.userAgent || (navigator as any).vendor || '';
    
    // Detect iOS - with safe access to maxTouchPoints
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
      (navigator.platform === 'MacIntel' && 
       typeof navigator.maxTouchPoints === 'number' && 
       navigator.maxTouchPoints > 1);
    
    // Detect mobile - with safe window access
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
      (typeof window.innerWidth === 'number' && window.innerWidth < 768);
    
    // DEFENSIVE: Safe matchMedia access with fallback
    const prefersReducedMotion = typeof window.matchMedia === 'function' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)')?.matches ?? false
      : false;
    
    // Low performance = iOS mobile or reduced motion preference
    const isLowPerformance = (isIOS && isMobile) || prefersReducedMotion;

    setPerformance({
      isIOS,
      isMobile,
      isLowPerformance,
      prefersReducedMotion,
    });

    // DEFENSIVE: Listen for reduced motion changes - with null checks
    if (typeof window.matchMedia !== 'function') return;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!mediaQuery) return;
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPerformance(prev => ({
        ...prev,
        prefersReducedMotion: e.matches,
        isLowPerformance: (prev.isIOS && prev.isMobile) || e.matches,
      }));
    };

    // DEFENSIVE: Safe event listener attachment
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => {
        if (typeof mediaQuery.removeEventListener === 'function') {
          mediaQuery.removeEventListener('change', handleChange);
        }
      };
    }
    
    return undefined;
  }, []);

  return performance;
}

// Lightweight static check for SSR-safe usage
export function getDevicePerformanceStatic(): DevicePerformance {
  // DEFENSIVE: Safe environment check
  if (!isBrowser() || !hasNavigator()) {
    return { isIOS: false, isMobile: false, isLowPerformance: false, prefersReducedMotion: false };
  }
  
  const userAgent = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || 
    (typeof window.innerWidth === 'number' && window.innerWidth < 768);
  
  // DEFENSIVE: Safe matchMedia access
  const prefersReducedMotion = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')?.matches ?? false
    : false;
  
  return {
    isIOS,
    isMobile,
    isLowPerformance: (isIOS && isMobile) || prefersReducedMotion,
    prefersReducedMotion,
  };
}
