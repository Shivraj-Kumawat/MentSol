/**
 * Safe array access utilities for Safari/iOS WebView compatibility
 * Prevents "undefined is not an object" runtime errors
 * 
 * CRITICAL: These utilities must be used throughout the app to prevent
 * "Minified React error #300" and ".length on undefined" crashes
 */

/**
 * Safely get the length of an array, returning 0 if input is invalid
 */
export const safeLength = (arr: unknown): number => {
  if (arr === null || arr === undefined) return 0;
  if (Array.isArray(arr)) return arr.length;
  if (typeof arr === 'string') return arr.length;
  return 0;
};

/**
 * Safely access an array element by index, returning fallback if invalid
 */
export const safeArrayAccess = <T>(
  arr: T[] | undefined | null,
  index: number,
  fallback: T
): T => {
  if (!Array.isArray(arr)) return fallback;
  if (index < 0 || index >= arr.length) return fallback;
  return arr[index] ?? fallback;
};

/**
 * Safely map over an array, returning empty array if input is invalid
 * CRITICAL: Use this instead of raw array.map() to prevent crashes
 */
export const safeMap = <T, R>(
  arr: T[] | undefined | null,
  callback: (item: T, index: number, array: T[]) => R
): R[] => {
  if (!Array.isArray(arr)) return [];
  return arr.map(callback);
};

/**
 * Safely filter an array, returning empty array if input is invalid
 * CRITICAL: Use this instead of raw array.filter() to prevent crashes
 */
export const safeFilter = <T>(
  arr: T[] | undefined | null,
  predicate: (item: T, index: number, array: T[]) => boolean
): T[] => {
  if (!Array.isArray(arr)) return [];
  return arr.filter(predicate);
};

/**
 * Safe window access check - for SSR and WebView compatibility
 */
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

/**
 * Safe navigator access check
 */
export const hasNavigator = (): boolean => {
  return typeof navigator !== 'undefined';
};

/**
 * Safely access a nested object property
 */
export const safeGet = <T>(
  obj: Record<string, any> | undefined | null,
  path: string,
  fallback: T
): T => {
  if (obj === null || obj === undefined) return fallback;
  
  const keys = path.split('.');
  let current: any = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) return fallback;
    current = current[key];
  }
  
  return (current ?? fallback) as T;
};

/**
 * Safely get a string value, with fallback
 */
export const safeString = (value: unknown, fallback: string = ''): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
};

/**
 * Safely get a number value, returning 0 if undefined/null/NaN
 */
export const safeNumber = (value: unknown): number => {
  if (typeof value === 'number' && !isNaN(value)) return value;
  const parsed = Number(value);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Check if we're running in iOS WebView (for conditional behavior)
 */
export const isIOSWebView = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isWebView = !ua.includes('Safari') || ua.includes('CriOS') || ua.includes('FxiOS');
  return isIOS && isWebView;
};

/**
 * Check if we're running in Safari
 */
export const isSafari = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('CriOS');
};
