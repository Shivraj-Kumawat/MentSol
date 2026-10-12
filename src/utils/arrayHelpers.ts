/**
 * Safely deduplicate an array to prevent React key collisions
 * Prevents React error #300 when rendering arrays with duplicate values
 */
export const safeUniqueArray = <T,>(arr: T[] | null | undefined): T[] => {
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr)];
};

/**
 * Creates a safe key for array rendering that handles duplicates
 * Use when values might be duplicated in the array
 */
export const createSafeKey = (value: string | number, index: number): string => {
  return `${value}-${index}`;
};
