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

const WEEKDAY_ORDER = WEEKDAYS.reduce((acc, day, index) => {
  acc[day] = index;
  return acc;
}, {});

export function normalizeRepeatDays(days) {
  if (!Array.isArray(days)) {
    return [];
  }
  const unique = Array.from(
    new Set(
      days
        .map(d => (typeof d === 'string' ? d.trim().toLowerCase() : ''))
        .filter(d => WEEKDAYS.includes(d)),
    ),
  );
  return unique.sort((a, b) => WEEKDAY_ORDER[a] - WEEKDAY_ORDER[b]);
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
  const days = normalizeRepeatDays(rawDays);
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
  const days = normalizeRepeatDays(rawDays);
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
