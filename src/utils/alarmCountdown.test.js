import {
  buildAlarmSaveToast,
  formatRemainingDuration,
} from './alarmCountdown';

describe('alarmCountdown utilities', () => {
  it('formats durations correctly', () => {
    expect(formatRemainingDuration(0)).toBe('less than 1 minute');
    expect(formatRemainingDuration(-1000)).toBe('less than 1 minute');
    expect(formatRemainingDuration(60 * 1000)).toBe('1 minute');
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

  it('builds alarm save toast messages accurately', () => {
    const now = 1700000000000;
    const alarm = {
      hour: 6,
      minute: 30,
      triggerAtMillis: now + (8 * 60 + 25) * 60 * 1000,
    };
    const toast = buildAlarmSaveToast(alarm, now);
    expect(toast).toBe('Alarm set for 6:30 AM · Rings in 8 hours 25 minutes');
  });

  it('handles null alarm gracefully', () => {
    expect(buildAlarmSaveToast(null)).toBe('Alarm saved.');
  });
});
