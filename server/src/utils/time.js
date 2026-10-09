import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import env from '../config/env.js';

export const TZ = env.UNIVERSITY_TIMEZONE;
export const DEFAULT_DURATION_MINUTES = env.DEFAULT_EXAM_DURATION_MINUTES;

/**
 * Combines a `YYYY-MM-DD` date and `HH:mm` time (interpreted in the
 * university timezone) into an absolute UTC Date.
 */
export function combineDateTimeInTz(dateStr, timeStr) {
  const iso = `${dateStr}T${timeStr.length === 5 ? `${timeStr}:00` : timeStr}`;
  return fromZonedTime(iso, TZ);
}

/** Formats an absolute date in the university timezone. */
export function formatInTz(date, pattern = 'yyyy-MM-dd HH:mm') {
  return formatInTimeZone(new Date(date), TZ, pattern);
}

export function todayInTz() {
  return formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd');
}

export function nowInTz() {
  return new Date();
}

/**
 * Resolves the effective [start, end) of an exam slot.
 * When the slot has no explicit end time, the documented default duration applies.
 */
export function resolveInterval(startDate, startTime, endTime) {
  const start = combineDateTimeInTz(startDate, startTime);
  let end;
  if (endTime) {
    end = combineDateTimeInTz(startDate, endTime);
  } else {
    end = new Date(start.getTime() + DEFAULT_DURATION_MINUTES * 60 * 1000);
  }
  return { start, end };
}

/**
 * Half-open interval overlap test: startA < endB && startB < endA.
 * Adjacent intervals (one ends exactly when the next begins) do NOT overlap.
 */
export function intervalsOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

export function isPastDate(dateStr) {
  return dateStr < todayInTz();
}

export function dayName(dateStr) {
  const d = combineDateTimeInTz(dateStr, '12:00');
  return formatInTimeZone(d, TZ, 'EEEE');
}

export default {
  TZ,
  DEFAULT_DURATION_MINUTES,
  combineDateTimeInTz,
  formatInTz,
  todayInTz,
  resolveInterval,
  intervalsOverlap,
  isPastDate,
  dayName,
};
