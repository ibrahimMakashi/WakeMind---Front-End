import {
  difficultyLabel,
  formatAlarmListTime,
  formatEditorTime,
  formatMissionTime,
  formatListTimeParts,
  formatClock,
  from24Hour,
  nextAlarm,
  relativeDayLabel,
  repeatLabel,
  sortAlarms,
  soundLabel,
  to24Hour,
} from './time';

test('formats a 24-hour clock as 12-hour text', () => {
  expect(formatClock(6, 5)).toEqual({
    hourText: '06',
    minuteText: '05',
    period: 'AM',
  });
  expect(formatClock(0, 0)).toEqual({
    hourText: '12',
    minuteText: '00',
    period: 'AM',
  });
  expect(formatClock(12, 0)).toEqual({
    hourText: '12',
    minuteText: '00',
    period: 'PM',
  });
  expect(formatClock(18, 30)).toEqual({
    hourText: '06',
    minuteText: '30',
    period: 'PM',
  });
});

test('converts between 12-hour and 24-hour values', () => {
  expect(to24Hour(12, 'AM')).toBe(0);
  expect(to24Hour(6, 'AM')).toBe(6);
  expect(to24Hour(12, 'PM')).toBe(12);
  expect(to24Hour(6, 'PM')).toBe(18);
  expect(from24Hour(0)).toEqual({hour12: 12, period: 'AM'});
  expect(from24Hour(18)).toEqual({hour12: 6, period: 'PM'});
});

test('labels today and tomorrow from local dates', () => {
  const now = new Date(2026, 9, 8, 15, 0, 0).getTime();
  const laterToday = new Date(2026, 9, 8, 18, 0, 0).getTime();
  const tomorrow = new Date(2026, 9, 9, 6, 30, 0).getTime();
  expect(relativeDayLabel(laterToday, now)).toBe('Today');
  expect(relativeDayLabel(tomorrow, now)).toBe('Tomorrow');
});

test('chooses the soonest enabled alarm', () => {
  const now = 1_000;
  const chosen = nextAlarm(
    [
      {id: 'later', enabled: true, triggerAtMillis: 5_000},
      {id: 'disabled', enabled: false, triggerAtMillis: 1_500},
      {id: 'past', enabled: true, triggerAtMillis: 500},
      {id: 'next', enabled: true, triggerAtMillis: 2_000},
    ],
    now,
  );
  expect(chosen.id).toBe('next');
  expect(nextAlarm([], now)).toBeNull();
});

test('formats the alarm list without a leading hour or a space before the period', () => {
  expect(formatAlarmListTime(5, 15)).toBe('5:15AM');
  expect(formatAlarmListTime(0, 0)).toBe('12:00AM');
  expect(formatAlarmListTime(12, 0)).toBe('12:00PM');
  expect(formatAlarmListTime(18, 30)).toBe('6:30PM');
});

test('formats editor time with a space before the period', () => {
  expect(formatEditorTime(0, 0)).toBe('12:00 AM');
  expect(formatEditorTime(12, 0)).toBe('12:00 PM');
  expect(formatEditorTime(18, 30)).toBe('6:30 PM');
});

test('splits mission and list times into clock and period parts', () => {
  expect(formatMissionTime(6, 0)).toEqual({timeText: '6:00', period: 'AM'});
  expect(formatListTimeParts(18, 5)).toEqual({timeText: '6:05', period: 'PM'});
});

test('sorts enabled and disabled alarms together by clock time', () => {
  const alarms = [
    {id: 'late-on', enabled: true, hour: 20, minute: 0, createdAtMillis: 1, triggerAtMillis: 1},
    {id: 'early-off', enabled: false, hour: 5, minute: 15, createdAtMillis: 9, triggerAtMillis: 99},
    {id: 'mid-on', enabled: true, hour: 7, minute: 45, createdAtMillis: 3, triggerAtMillis: 2},
    {id: 'mid-off', enabled: false, hour: 7, minute: 0, createdAtMillis: 2, triggerAtMillis: 50},
  ];
  expect(sortAlarms(alarms).map(alarm => alarm.id)).toEqual([
    'early-off',
    'mid-off',
    'mid-on',
    'late-on',
  ]);
});

test('does not move an alarm when only its enabled state changes', () => {
  const alarms = [
    {id: 'b', enabled: false, hour: 8, minute: 0, createdAtMillis: 2},
    {id: 'a', enabled: true, hour: 6, minute: 30, createdAtMillis: 1},
  ];
  const toggled = alarms.map(alarm => ({...alarm, enabled: !alarm.enabled}));
  expect(sortAlarms(alarms).map(alarm => alarm.id)).toEqual(['a', 'b']);
  expect(sortAlarms(toggled).map(alarm => alarm.id)).toEqual(['a', 'b']);
});

test('moves an alarm after its clock time changes', () => {
  const before = [
    {id: 'a', enabled: false, hour: 5, minute: 0, createdAtMillis: 1},
    {id: 'b', enabled: true, hour: 7, minute: 0, createdAtMillis: 2},
  ];
  const edited = before.map(alarm =>
    alarm.id === 'a' ? {...alarm, hour: 9, minute: 0} : alarm,
  );
  expect(sortAlarms(before).map(alarm => alarm.id)).toEqual(['a', 'b']);
  expect(sortAlarms(edited).map(alarm => alarm.id)).toEqual(['b', 'a']);
});

test('breaks identical clock times by creation time, then id', () => {
  const alarms = [
    {id: 'c', enabled: true, hour: 6, minute: 30, createdAtMillis: 5},
    {id: 'b', enabled: false, hour: 6, minute: 30, createdAtMillis: 2},
    {id: 'a', enabled: true, hour: 6, minute: 30, createdAtMillis: 2},
  ];
  expect(sortAlarms(alarms).map(alarm => alarm.id)).toEqual(['a', 'b', 'c']);
});

test('does not mutate the alarm array it sorts', () => {
  const alarms = [
    {id: 'second', enabled: false, hour: 1, minute: 0, createdAtMillis: 2},
    {id: 'first', enabled: true, hour: 9, minute: 0, triggerAtMillis: 10, createdAtMillis: 3},
  ];
  const ordered = sortAlarms(alarms);
  expect(ordered).not.toBe(alarms);
  expect(alarms.map(alarm => alarm.id)).toEqual(['second', 'first']);
  expect(sortAlarms(null)).toEqual([]);
});

test('labels known schedule, difficulty, and sound values', () => {
  expect(repeatLabel('once')).toBe('Once');
  expect(difficultyLabel('easy')).toBe('Easy');
  expect(soundLabel('system-alarm')).toBe('System alarm');
  expect(soundLabel('')).toBe('System alarm');
});
