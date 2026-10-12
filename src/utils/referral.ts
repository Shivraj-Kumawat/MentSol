// Referral tracking utilities for Marketing Partner Portal

const REFERRAL_STORAGE_KEY = 'mentsol_referral_code';
const SUPABASE_URL = 'https://rutxafzivumqnyxqtdsa.supabase.co';

/**
 * Capture referral code from URL and store in localStorage
 * Supports both path format (/ref/code) and query format (?ref=code)
 * Should be called on app initialization
 */
export function captureRefFromUrl(): void {
  try {
    let ref: string | null = null;
    
    // Check query parameter first: ?ref=xxx (works with hash routing)
    const params = new URLSearchParams(window.location.search);
    ref = params.get('ref');
    
    // Also check hash-based query params: /#/path?ref=xxx
    if (!ref && window.location.hash.includes('?')) {
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      ref = hashParams.get('ref');
    }
    
    // Check path format for non-hash URLs: /ref/xxx (legacy support)
    if (!ref) {
      const pathMatch = window.location.pathname.match(/^\/ref\/([a-zA-Z0-9]+)/i);
      if (pathMatch && pathMatch[1]) {
        ref = pathMatch[1];
      }
    }
    
    if (ref && ref.trim().length > 0) {
      const cleanRef = ref.trim();
      localStorage.setItem(REFERRAL_STORAGE_KEY, cleanRef);
      console.log('Referral code captured:', cleanRef);
      
      // Log the click asynchronously (fire and forget)
      logReferralClick(cleanRef);
      
      // Clean URL - for non-hash /ref/ paths, redirect to hash-based auth
      if (window.location.pathname.startsWith('/ref/')) {
        // Redirect to hash-based auth route
        window.location.href = window.location.origin + '/#/auth?role=student';
      } else {
        // Remove ref from query params but keep others
        params.delete('ref');
        const newUrl = params.toString() 
          ? `${window.location.pathname}?${params.toString()}` 
          : window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  } catch (e) {
    console.warn('Failed to capture referral:', e);
  }
}

/**
 * Log referral click to the edge function
 * @param shortRef The short referral code
 */
export async function logReferralClick(shortRef: string): Promise<void> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/referral-click?ref=${encodeURIComponent(shortRef)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      console.log('Referral click logged for:', shortRef);
    } else {
      console.warn('Referral click logging returned:', response.status);
    }
  } catch (e) {
    // Silent fail - don't block user experience for analytics
    console.warn('Failed to log referral click:', e);
  }
}

/**
 * Get stored referral code
 */
export function getStoredRef(): string | null {
  try {
    return localStorage.getItem(REFERRAL_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Clear stored referral code (call after successful attribution)
 */
export function clearStoredRef(): void {
  try {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Generate a unique short referral code
 */
export function generateShortRef(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Generate a display code from user info
 */
export function generatePromoCode(email: string): string {
  const prefix = email.split('@')[0].substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const suffix = generateShortRef().toUpperCase();
  return `${prefix}-${suffix}`;
}
