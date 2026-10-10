import {
  difficultyLabel,
  formatClock,
  from24Hour,
  nextAlarm,
  relativeDayLabel,
  repeatLabel,
  sortAlarms,
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

test('sorts enabled alarms by the next trigger, then creation, then id', () => {
  const alarms = [
    {id: 'b', enabled: true, hour: 9, minute: 0, triggerAtMillis: 300, createdAtMillis: 2},
    {id: 'a', enabled: true, hour: 8, minute: 0, triggerAtMillis: 100, createdAtMillis: 9},
    {id: 'd', enabled: true, hour: 1, minute: 0, triggerAtMillis: 300, createdAtMillis: 2},
    {id: 'c', enabled: true, hour: 2, minute: 0, triggerAtMillis: 300, createdAtMillis: 1},
    {id: 'e', enabled: true, hour: 3, minute: 0, triggerAtMillis: Number.NaN, createdAtMillis: 0},
  ];
  expect(sortAlarms(alarms).map(alarm => alarm.id)).toEqual([
    'a',
    'c',
    'b',
    'd',
    'e',
  ]);
});

test('sorts disabled alarms by clock time below enabled alarms', () => {
  const alarms = [
    {
      id: 'enabled-later',
      enabled: true,
      hour: 23,
      minute: 0,
      triggerAtMillis: 9_000,
      createdAtMillis: 1,
    },
    {
      id: 'disabled-evening',
      enabled: false,
      hour: 18,
      minute: 15,
      triggerAtMillis: 100,
      createdAtMillis: 1,
    },
    {
      id: 'disabled-morning',
      enabled: false,
      hour: 6,
      minute: 30,
      triggerAtMillis: 50_000,
      createdAtMillis: 8,
    },
    {
      id: 'disabled-same-later-id',
      enabled: false,
      hour: 6,
      minute: 30,
      triggerAtMillis: 1,
      createdAtMillis: 4,
    },
    {
      id: 'disabled-same-earlier-id',
      enabled: false,
      hour: 6,
      minute: 30,
      triggerAtMillis: 1,
      createdAtMillis: 4,
    },
  ];
  expect(sortAlarms(alarms).map(alarm => alarm.id)).toEqual([
    'enabled-later',
    'disabled-same-earlier-id',
    'disabled-same-later-id',
    'disabled-morning',
    'disabled-evening',
  ]);
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

test('labels known schedule and difficulty values', () => {
  expect(repeatLabel('once')).toBe('Once');
  expect(difficultyLabel('easy')).toBe('Easy');
});
