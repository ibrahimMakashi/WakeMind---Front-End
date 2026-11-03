export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const WEEKDAY_CONFIG = [
  {id: 'mon', label: 'M', shortName: 'Mon', fullName: 'Monday'},
  {id: 'tue', label: 'T', shortName: 'Tue', fullName: 'Tuesday'},
  {id: 'wed', label: 'W', shortName: 'Wed', fullName: 'Wednesday'},
  {id: 'thu', label: 'T', shortName: 'Thu', fullName: 'Thursday'},
  {id: 'fri', label: 'F', shortName: 'Fri', fullName: 'Friday'},
  {id: 'sat', label: 'S', shortName: 'Sat', fullName: 'Saturday'},
  {id: 'sun', label: 'S', shortName: 'Sun', fullName: 'Sunday'},
];

/**
 * Validates, deduplicates, and normalizes weekday array in Monday to Sunday order.
 * Throws on invalid weekday values.
 * Null or undefined safely returns [] for backward compatibility with older alarm records.
 *
 * @param {string[]|null|undefined} days
 * @returns {string[]}
 */
export function normalizeRepeatDays(days) {
  if (days === null || days === undefined) {
    return [];
  }
  if (!Array.isArray(days)) {
    throw new TypeError('repeatDays must be an array of weekday strings.');
  }
  const seen = new Set();
  for (const item of days) {
    if (typeof item !== 'string') {
      throw new TypeError(`Invalid weekday value: ${JSON.stringify(item)}. Must be a string.`);
    }
    const normalized = item.trim().toLowerCase();
    if (!WEEKDAYS.includes(normalized)) {
      throw new Error(`Invalid weekday: '${item}'. Valid weekdays are ${WEEKDAYS.join(', ')}.`);
    }
    seen.add(normalized);
  }
  return WEEKDAYS.filter(d => seen.has(d));
}

export function isWeekdays(normalizedDays) {
  if (normalizedDays.length !== 5) {
    return false;
  }
  return ['mon', 'tue', 'wed', 'thu', 'fri'].every(d => normalizedDays.includes(d));
}

export function isWeekends(normalizedDays) {
  if (normalizedDays.length !== 2) {
    return false;
  }
  return ['sat', 'sun'].every(d => normalizedDays.includes(d));
}

export function isEveryDay(normalizedDays) {
  return normalizedDays.length === 7;
}

export function formatRepeatSummary(rawDays) {
  let days;
  try {
    days = normalizeRepeatDays(rawDays);
  } catch {
    days = [];
  }

  if (days.length === 0) {
    return 'Once';
  }
  if (isEveryDay(days)) {
    return 'Every Day';
  }
  if (isWeekdays(days)) {
    return 'Weekdays (5 Days)';
  }
  if (isWeekends(days)) {
    return 'Weekends (2 Days)';
  }
  if (days.length === 1) {
    const item = WEEKDAY_CONFIG.find(c => c.id === days[0]);
    return `Every ${item ? item.fullName : days[0]}`;
  }
  if (days.length <= 3) {
    const names = days
      .map(d => WEEKDAY_CONFIG.find(c => c.id === d)?.shortName || d)
      .join(', ');
    return `${names} (${days.length} Days)`;
  }
  return `Custom (${days.length} Days)`;
}

export function formatRepeatBadge(rawDays) {
  let days;
  try {
    days = normalizeRepeatDays(rawDays);
  } catch {
    days = [];
  }

  if (days.length === 0) {
    return 'Once';
  }
  if (isEveryDay(days)) {
    return 'Every day';
  }
  if (isWeekdays(days)) {
    return 'Weekdays';
  }
  if (isWeekends(days)) {
    return 'Weekends';
  }
  if (days.length <= 2) {
    return days.map(d => WEEKDAY_CONFIG.find(c => c.id === d)?.shortName || d).join(', ');
  }
  return `${days.length} days`;
}
