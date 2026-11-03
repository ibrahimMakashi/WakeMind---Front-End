import {formatListTimeParts} from './time';

/**
 * Formats duration milliseconds into a readable phrase like "8 hours 25 minutes" or "1 day 2 hours".
 * Uses Math.ceil() for minute precision.
 * @param {number} millis
 * @returns {string}
 */
export function formatRemainingDuration(millis) {
  if (typeof millis !== 'number' || isNaN(millis) || millis <= 0) {
    return 'less than 1 minute';
  }

  const totalMinutes = Math.max(1, Math.ceil(millis / 60000));
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
 * Distinguishes "Alarm set for..." from "Alarm updated for...".
 * If triggerAtMillis is missing, invalid, or in the past, displays a generic confirmation.
 *
 * @param {object} savedAlarm
 * @param {object|boolean|number} [options={}]
 * @returns {string}
 */
export function buildAlarmSaveToast(savedAlarm, options = {}) {
  let isEditing = false;
  let nowMillis = Date.now();

  if (typeof options === 'boolean') {
    isEditing = options;
  } else if (typeof options === 'number') {
    nowMillis = options;
  } else if (typeof options === 'object' && options !== null) {
    if (typeof options.isEditing === 'boolean') {
      isEditing = options.isEditing;
    }
    if (typeof options.nowMillis === 'number') {
      nowMillis = options.nowMillis;
    }
  }

  const genericConfirmation = isEditing ? 'Alarm updated.' : 'Alarm saved.';
  if (!savedAlarm) {
    return genericConfirmation;
  }

  const trigger = savedAlarm.triggerAtMillis;
  if (
    typeof trigger !== 'number' ||
    isNaN(trigger) ||
    !isFinite(trigger) ||
    trigger <= nowMillis
  ) {
    return genericConfirmation;
  }

  if (typeof savedAlarm.hour !== 'number' || typeof savedAlarm.minute !== 'number') {
    return genericConfirmation;
  }

  const {timeText, period} = formatListTimeParts(savedAlarm.hour, savedAlarm.minute);
  const remaining = trigger - nowMillis;
  const durationText = formatRemainingDuration(remaining);
  const prefix = isEditing ? 'Alarm updated for' : 'Alarm set for';

  return `${prefix} ${timeText} ${period} · Rings in ${durationText}`;
}
