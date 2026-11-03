import {formatListTimeParts} from './time';

/**
 * Formats duration milliseconds into a readable phrase like "8 hours 25 minutes" or "1 day 2 hours".
 * @param {number} millis
 * @returns {string}
 */
export function formatRemainingDuration(millis) {
  if (millis <= 0) {
    return 'less than 1 minute';
  }

  const totalMinutes = Math.max(1, Math.round(millis / 60000));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  const parts = [];
  if (days > 0) {
    parts.push(`${days} day${days > 1 ? 's' : ''}`);
  }
  if (hours > 0) {
    parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  }

  return parts.join(' ');
}

/**
 * Builds the text for the toast shown after saving an alarm.
 * Example: "Alarm set for 6:30 AM · Rings in 8 hours 25 minutes"
 * @param {object} savedAlarm
 * @param {number} [nowMillis=Date.now()]
 * @returns {string}
 */
export function buildAlarmSaveToast(savedAlarm, nowMillis = Date.now()) {
  if (!savedAlarm) {
    return 'Alarm saved.';
  }

  const {timeText, period} = formatListTimeParts(savedAlarm.hour, savedAlarm.minute);
  const remaining = (savedAlarm.triggerAtMillis || nowMillis) - nowMillis;
  const durationText = formatRemainingDuration(remaining);

  return `Alarm set for ${timeText} ${period} · Rings in ${durationText}`;
}
