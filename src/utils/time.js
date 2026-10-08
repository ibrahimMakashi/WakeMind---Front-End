const REPEAT_LABELS = {
  once: 'Once',
};

const DIFFICULTY_LABELS = {
  easy: 'Easy',
};

export function formatClock(hour, minute) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return {
    hourText: String(hour12).padStart(2, '0'),
    minuteText: String(minute).padStart(2, '0'),
    period,
  };
}

export function to24Hour(hour12, period) {
  if (period === 'AM') {
    return hour12 === 12 ? 0 : hour12;
  }
  return hour12 === 12 ? 12 : hour12 + 12;
}

export function from24Hour(hour24) {
  return {
    hour12: hour24 % 12 === 0 ? 12 : hour24 % 12,
    period: hour24 >= 12 ? 'PM' : 'AM',
  };
}

export function repeatLabel(repeat) {
  return REPEAT_LABELS[repeat] || repeat;
}

export function difficultyLabel(difficulty) {
  return DIFFICULTY_LABELS[difficulty] || difficulty;
}

export function relativeDayLabel(triggerAtMillis, now = Date.now()) {
  const trigger = new Date(triggerAtMillis);
  const current = new Date(now);
  const startOfDay = date =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.round(
    (startOfDay(trigger) - startOfDay(current)) / 86400000,
  );
  if (dayDiff === 0) {
    return 'Today';
  }
  if (dayDiff === 1) {
    return 'Tomorrow';
  }
  return trigger.toLocaleDateString(undefined, {weekday: 'long'});
}

export function nextAlarm(alarms, now = Date.now()) {
  const upcoming = alarms
    .filter(alarm => alarm.enabled && alarm.triggerAtMillis > now)
    .sort((left, right) => left.triggerAtMillis - right.triggerAtMillis);
  return upcoming[0] || null;
}
