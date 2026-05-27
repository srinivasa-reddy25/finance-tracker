/**
 * Format a number as Indian Rupee currency.
 * e.g. 1500 → "₹1,500", 125000 → "₹1.3L"
 */
export function formatAmount(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

/**
 * Format a number as full Indian Rupee with locale separators.
 * e.g. 1500 → "₹1,500"
 */
export function formatAmountFull(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`;
}

/**
 * Parse a string to a valid positive number, returning null if invalid.
 */
export function parseAmount(value: string): number | null {
  const parsed = parseFloat(value);
  if (isNaN(parsed) || parsed <= 0) return null;
  return parsed;
}

/**
 * Clamp a number within the allowed transaction amount range.
 */
export const AMOUNT_LIMITS = {
  MIN: 0.01,
  MAX: 10_000_000, // 1 crore
} as const;

export function isValidAmount(value: string): boolean {
  const parsed = parseFloat(value);
  return (
    !isNaN(parsed) && parsed >= AMOUNT_LIMITS.MIN && parsed <= AMOUNT_LIMITS.MAX
  );
}
