import {formatArmingCountdown} from './countdown';

test('formats hours and minutes until trigger', () => {
  const now = 1_000_000;
  expect(formatArmingCountdown(now + 42 * 60_000, now)).toBe('Arming in 42 mins');
  expect(formatArmingCountdown(now + 7 * 3600_000 + 42 * 60_000, now)).toBe(
    'Arming in 7 hrs 42 mins',
  );
});

test('handles past or invalid triggers', () => {
  expect(formatArmingCountdown(500, 1_000)).toBe('Arming soon');
  expect(formatArmingCountdown(Number.NaN, 0)).toBe('Arming soon');
});
