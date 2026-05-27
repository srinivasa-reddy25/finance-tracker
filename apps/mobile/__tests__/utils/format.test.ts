import {
  formatAmount,
  formatAmountFull,
  isValidAmount,
  parseAmount,
  AMOUNT_LIMITS,
} from '../../src/utils/format';

describe('formatAmount', () => {
  it('formats amounts below 1000 as ₹ + integer', () => {
    expect(formatAmount(500)).toBe('₹500');
    expect(formatAmount(999)).toBe('₹999');
  });

  it('formats amounts 1000–99999 as ₹Xk', () => {
    expect(formatAmount(1000)).toBe('₹1.0k');
    expect(formatAmount(1500)).toBe('₹1.5k');
  });

  it('formats amounts >= 100000 as ₹XL', () => {
    expect(formatAmount(100000)).toBe('₹1.0L');
    expect(formatAmount(250000)).toBe('₹2.5L');
  });
});

describe('formatAmountFull', () => {
  it('formats with ₹ and locale separators', () => {
    expect(formatAmountFull(1500)).toContain('₹');
    expect(formatAmountFull(1500)).toContain('1,500');
  });
});

describe('parseAmount', () => {
  it('returns a number for valid strings', () => {
    expect(parseAmount('100')).toBe(100);
    expect(parseAmount('99.5')).toBe(99.5);
  });

  it('returns null for non-numeric strings', () => {
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('')).toBeNull();
  });

  it('returns null for zero and negative values', () => {
    expect(parseAmount('0')).toBeNull();
    expect(parseAmount('-50')).toBeNull();
  });
});

describe('isValidAmount', () => {
  it('returns true for valid amounts', () => {
    expect(isValidAmount('100')).toBe(true);
    expect(isValidAmount(String(AMOUNT_LIMITS.MAX))).toBe(true);
  });

  it('returns false for invalid amounts', () => {
    expect(isValidAmount('0')).toBe(false);
    expect(isValidAmount('-1')).toBe(false);
    expect(isValidAmount('abc')).toBe(false);
  });

  it('returns false for amounts above the max', () => {
    expect(isValidAmount(String(AMOUNT_LIMITS.MAX + 1))).toBe(false);
  });
});
