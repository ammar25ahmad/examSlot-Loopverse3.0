import { format, parseISO } from 'date-fns';

export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return parseISO(value);
  return new Date(value);
}

export function formatDate(value, pattern = 'dd MMM yyyy') {
  const d = toDate(value);
  return d && !Number.isNaN(d.getTime()) ? format(d, pattern) : '—';
}

export function formatDateTime(value, pattern = 'dd MMM yyyy, HH:mm') {
  return formatDate(value, pattern);
}

export function timeRange(start, end) {
  if (!start) return '—';
  return end ? `${start}–${end}` : `${start} (+3h default)`;
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function titleCase(value = '') {
  return value
    .toString()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default { formatDate, formatDateTime, timeRange, initials, titleCase, toDate };
