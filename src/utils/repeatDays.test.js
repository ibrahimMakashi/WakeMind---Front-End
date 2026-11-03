import {
  formatRepeatBadge,
  formatRepeatSummary,
  isEveryDay,
  isWeekdays,
  isWeekends,
  normalizeRepeatDays,
  WEEKDAYS,
} from './repeatDays';

describe('repeatDays utilities', () => {
  it('normalizes, deduplicates, and sorts days in Mon-Sun order', () => {
    expect(normalizeRepeatDays(['fri', 'MON', 'wed', 'mon'])).toEqual([
      'mon',
      'wed',
      'fri',
    ]);
  });

  it('rejects invalid weekday values by throwing an error', () => {
    expect(() => normalizeRepeatDays(['funday'])).toThrow(
      "Invalid weekday: 'funday'",
    );
    expect(() => normalizeRepeatDays(['mon', 'invalid'])).toThrow(
      "Invalid weekday: 'invalid'",
    );
    expect(() => normalizeRepeatDays(['mon', 123])).toThrow(TypeError);
    expect(() => normalizeRepeatDays('not an array')).toThrow(TypeError);
  });

  it('preserves backward compatibility with null and undefined older records', () => {
    expect(normalizeRepeatDays(null)).toEqual([]);
    expect(normalizeRepeatDays(undefined)).toEqual([]);
    expect(normalizeRepeatDays([])).toEqual([]);
  });

  it('identifies weekdays, weekends, and every day correctly', () => {
    expect(isWeekdays(['mon', 'tue', 'wed', 'thu', 'fri'])).toBe(true);
    expect(isWeekdays(['mon', 'tue', 'wed', 'thu'])).toBe(false);
    expect(isWeekends(['sat', 'sun'])).toBe(true);
    expect(isWeekends(['sun'])).toBe(false);
    expect(isEveryDay(WEEKDAYS)).toBe(true);
  });

  it('formats repeat summaries matching UI requirements', () => {
    expect(formatRepeatSummary([])).toBe('Once');
    expect(formatRepeatSummary(null)).toBe('Once');
    expect(formatRepeatSummary(['mon', 'tue', 'wed', 'thu', 'fri'])).toBe('Weekdays (5 Days)');
    expect(formatRepeatSummary(['sat', 'sun'])).toBe('Weekends (2 Days)');
    expect(formatRepeatSummary(WEEKDAYS)).toBe('Every Day');
    expect(formatRepeatSummary(['mon'])).toBe('Every Monday');
    expect(formatRepeatSummary(['mon', 'wed', 'fri'])).toBe('Mon, Wed, Fri (3 Days)');
    expect(formatRepeatSummary(['mon', 'tue', 'wed', 'thu'])).toBe('Custom (4 Days)');
  });

  it('formats compact repeat badges for alarm list', () => {
    expect(formatRepeatBadge([])).toBe('Once');
    expect(formatRepeatBadge(undefined)).toBe('Once');
    expect(formatRepeatBadge(['mon', 'tue', 'wed', 'thu', 'fri'])).toBe('Weekdays');
    expect(formatRepeatBadge(['sat', 'sun'])).toBe('Weekends');
    expect(formatRepeatBadge(WEEKDAYS)).toBe('Every day');
    expect(formatRepeatBadge(['mon'])).toBe('Mon');
    expect(formatRepeatBadge(['mon', 'fri'])).toBe('Mon, Fri');
    expect(formatRepeatBadge(['mon', 'wed', 'fri'])).toBe('3 days');
  });
});
