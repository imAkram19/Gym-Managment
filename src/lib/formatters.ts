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

/**
 * Format any time string (HH:MM:SS, HH:MM, or ISO date) to an easy readable 12-hour format:
 * e.g. "18:43:22" => "6:43 PM", "11:43:00" => "11:43 AM", "23:15" => "11:15 PM"
 */
export function formatTime12h(timeStr?: string | null): string {
  if (!timeStr) return '';
  const trimmed = String(timeStr).trim();
  if (!trimmed) return '';

  // Already formatted like "11:43 AM" or "6:43 PM"
  if (/\b(AM|PM)\b/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // Handle ISO string or full datetime
  if (trimmed.includes('T') || (trimmed.includes('-') && trimmed.includes(':'))) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
  }

  // Handle HH:MM:SS or HH:MM
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12}:${minutes} ${period}`;
  }

  return trimmed;
}
