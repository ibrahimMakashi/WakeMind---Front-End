import {
  difficultyLabel,
  formatClock,
  from24Hour,
  nextAlarm,
  relativeDayLabel,
  repeatLabel,
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

test('labels known schedule and difficulty values', () => {
  expect(repeatLabel('once')).toBe('Once');
  expect(difficultyLabel('easy')).toBe('Easy');
});
