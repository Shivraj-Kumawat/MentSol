import { formatDistanceToNow } from "date-fns";

/**
 * Safe date parsing utilities for Safari/iOS WebView compatibility
 * Prevents "Invalid Date" crashes in date-fns functions during unmount/remount cycles
 */

/**
 * Safely parse a date string, returning null if invalid
 * Prevents "Invalid Date" crashes in date-fns functions
 */
export const safeParseDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
};

/**
 * Safe formatDistanceToNow that returns fallback on invalid dates
 * CRITICAL: Use this instead of raw formatDistanceToNow to prevent crashes
 */
export const safeFormatDistanceToNow = (
  dateString: string | null | undefined,
  fallback: string = 'Recently'
): string => {
  const date = safeParseDate(dateString);
  if (!date) return fallback;
  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return fallback;
  }
};

/**
 * Check if a date string is valid
 */
export const isValidDateString = (dateString: string | null | undefined): boolean => {
  return safeParseDate(dateString) !== null;
};
