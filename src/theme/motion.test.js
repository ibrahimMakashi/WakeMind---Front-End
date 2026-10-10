import {motionDuration} from './motion';

test('uses a short motion duration and removes it when reduced motion is on', () => {
  expect(motionDuration(false, 220)).toBe(220);
  expect(motionDuration(false)).toBe(200);
  expect(motionDuration(true, 220)).toBe(0);
});
