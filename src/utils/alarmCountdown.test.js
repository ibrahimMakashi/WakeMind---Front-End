import {
  buildAlarmSaveToast,
  formatRemainingDuration,
} from './alarmCountdown';

describe('alarmCountdown utilities', () => {
  it('formats durations correctly using Math.ceil', () => {
    expect(formatRemainingDuration(0)).toBe('less than 1 minute');
    expect(formatRemainingDuration(-1000)).toBe('less than 1 minute');
    expect(formatRemainingDuration(null)).toBe('less than 1 minute');
    expect(formatRemainingDuration(1000)).toBe('1 minute'); // 1s ceiling to 1 min
    expect(formatRemainingDuration(60 * 1000)).toBe('1 minute');
    expect(formatRemainingDuration(61 * 1000)).toBe('2 minutes'); // 61s ceiling to 2 min
    expect(formatRemainingDuration(5 * 60 * 1000)).toBe('5 minutes');
    expect(formatRemainingDuration(60 * 60 * 1000)).toBe('1 hour');
    expect(formatRemainingDuration((8 * 60 + 25) * 60 * 1000)).toBe(
      '8 hours 25 minutes',
    );
    expect(formatRemainingDuration((24 * 60 + 30) * 60 * 1000)).toBe(
      '1 day 30 minutes',
    );
    expect(formatRemainingDuration((2 * 24 * 60 + 3 * 60 + 15) * 60 * 1000)).toBe(
      '2 days 3 hours 15 minutes',
    );
  });

  it('distinguishes "Alarm set" for new alarms from "Alarm updated" for edited alarms', () => {
    const now = 1700000000000;
    const alarm = {
      hour: 6,
      minute: 30,
      triggerAtMillis: now + (8 * 60 + 25) * 60 * 1000,
    };

    const newToast = buildAlarmSaveToast(alarm, {isEditing: false, nowMillis: now});
    expect(newToast).toBe('Alarm set for 6:30 AM · Rings in 8 hours 25 minutes');

    const updatedToast = buildAlarmSaveToast(alarm, {isEditing: true, nowMillis: now});
    expect(updatedToast).toBe('Alarm updated for 6:30 AM · Rings in 8 hours 25 minutes');
  });

  it('displays generic confirmation when triggerAtMillis is missing or invalid', () => {
    const now = 1700000000000;
    expect(buildAlarmSaveToast(null)).toBe('Alarm saved.');
    expect(buildAlarmSaveToast(null, {isEditing: true})).toBe('Alarm updated.');

    const missingTrigger = {hour: 6, minute: 30};
    expect(buildAlarmSaveToast(missingTrigger, {isEditing: false, nowMillis: now})).toBe('Alarm saved.');
    expect(buildAlarmSaveToast(missingTrigger, {isEditing: true, nowMillis: now})).toBe('Alarm updated.');

    const pastTrigger = {hour: 6, minute: 30, triggerAtMillis: now - 1000};
    expect(buildAlarmSaveToast(pastTrigger, {isEditing: false, nowMillis: now})).toBe('Alarm saved.');
    expect(buildAlarmSaveToast(pastTrigger, {isEditing: true, nowMillis: now})).toBe('Alarm updated.');

    const invalidTrigger = {hour: 6, minute: 30, triggerAtMillis: NaN};
    expect(buildAlarmSaveToast(invalidTrigger, {isEditing: true, nowMillis: now})).toBe('Alarm updated.');
  });
});
