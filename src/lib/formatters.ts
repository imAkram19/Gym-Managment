/**
 * Iron Gym V2 — Precision Formatting Utilities
 * Standardizes currency, numbers, and pluralization rules across the application.
 */

const enPluralRules = new Intl.PluralRules('en-US');

/**
 * Format an integer or float into Indian Rupee format: ₹1,50,000
 */
export function formatCurrency(value: number | string): string {
  const num = typeof value === 'number' ? value : parseFloat(value) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
}

/**
 * Format an integer or float with Indian numbering grouping (e.g. 1,00,000)
 */
export function formatNumber(value: number | string): string {
  const num = typeof value === 'number' ? value : parseFloat(value) || 0;
  return num.toLocaleString('en-IN');
}

/**
 * Pluralize a word based on count using Intl.PluralRules
 * Example:
 *   pluralize(1, 'member') => "1 member"
 *   pluralize(12, 'member') => "12 members"
 *   pluralize(0, 'check-in') => "0 check-ins"
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  const rule = enPluralRules.select(count);
  const word = rule === 'one' ? singular : (plural || `${singular}s`);
  return `${formatNumber(count)} ${word}`;
}

/**
 * Plural word only (without prefixing count)
 * Example:
 *   pluralWord(1, 'member') => "member"
 *   pluralWord(5, 'member') => "members"
 */
export function pluralWord(count: number, singular: string, plural?: string): string {
  const rule = enPluralRules.select(count);
  return rule === 'one' ? singular : (plural || `${singular}s`);
}
