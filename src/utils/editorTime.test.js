import {
  applyConfirmedPickerResult,
  buildSavePayload,
  getNextMinuteSelection,
  initialEditorSelection,
} from './editorTime';
import {to24Hour} from './time';

test('initializes editor draft from stored 24-hour alarm times', () => {
  expect(initialEditorSelection(0, 0)).toEqual({
    hour12: 12,
    minute: 0,
    period: 'AM',
  });
  expect(initialEditorSelection(12, 0)).toEqual({
    hour12: 12,
    minute: 0,
    period: 'PM',
  });
  expect(initialEditorSelection(18, 30)).toEqual({
    hour12: 6,
    minute: 30,
    period: 'PM',
  });
});

test('rounds forward to the next full minute for new alarms', () => {
  const t1 = new Date(2026, 10, 8, 8, 30, 15);
  expect(getNextMinuteSelection(t1)).toEqual({
    hour12: 8,
    minute: 31,
    period: 'AM',
  });

  const t2 = new Date(2026, 10, 8, 23, 59, 45);
  expect(getNextMinuteSelection(t2)).toEqual({
    hour12: 12,
    minute: 0,
    period: 'AM',
  });
});

test('applies a confirmed native picker result to the draft', () => {
  const draft = initialEditorSelection(6, 30);
  const updated = applyConfirmedPickerResult(draft, {
    action: 'set',
    hour: 18,
    minute: 5,
  });
  expect(updated).toEqual({hour12: 6, minute: 5, period: 'PM'});
  expect(to24Hour(updated.hour12, updated.period)).toBe(18);
});

test('leaves the draft unchanged when the picker is dismissed', () => {
  const draft = initialEditorSelection(0, 15);
  expect(applyConfirmedPickerResult(draft, {action: 'dismissed'})).toEqual(draft);
  expect(applyConfirmedPickerResult(draft, null)).toEqual(draft);
});

test('opens the picker with the current draft converted to 24-hour time', () => {
  const midnight = initialEditorSelection(0, 0);
  expect(to24Hour(midnight.hour12, midnight.period)).toBe(0);
  const afternoon = initialEditorSelection(18, 0);
  expect(to24Hour(afternoon.hour12, afternoon.period)).toBe(18);
});

test('builds save payloads that preserve enabled state and alarm id when editing', () => {
  const alarm = {
    id: 'alarm-1',
    enabled: false,
    hour: 5,
    minute: 0,
    label: 'Wake',
    vibrate: true,
    puzzleImageId: 'mount-fuji',
    puzzleImageType: 'bundled',
    repeatDays: ['mon', 'tue'],
  };
  const draft = initialEditorSelection(6, 30);
  expect(
    buildSavePayload({
      alarm,
      hour12: draft.hour12,
      minute: draft.minute,
      period: draft.period,
      label: ' Morning ',
      vibrate: false,
      editing: true,
    }),
  ).toEqual({
    id: 'alarm-1',
    hour: 6,
    minute: 30,
    enabled: false,
    vibrate: false,
    label: 'Morning',
    puzzleImageId: 'mount-fuji',
    puzzleImageType: 'bundled',
    difficulty: 'easy',
    repeatDays: ['mon', 'tue'],
  });
});

test('builds a new-alarm payload without an id and enabled by default', () => {
  const draft = initialEditorSelection(12, 0);
  expect(
    buildSavePayload({
      alarm: null,
      hour12: draft.hour12,
      minute: draft.minute,
      period: draft.period,
      label: 'Alarm',
      vibrate: true,
      editing: false,
      repeatDays: ['mon', 'wed', 'fri'],
    }),
  ).toEqual({
    id: undefined,
    hour: 12,
    minute: 0,
    enabled: true,
    vibrate: true,
    label: 'Alarm',
    puzzleImageId: 'moraine-lake',
    puzzleImageType: 'bundled',
    difficulty: 'easy',
    repeatDays: ['mon', 'wed', 'fri'],
  });
});

test('builds save payload with custom puzzle image and specific difficulty', () => {
  const draft = initialEditorSelection(7, 0);
  expect(
    buildSavePayload({
      alarm: null,
      hour12: draft.hour12,
      minute: draft.minute,
      period: draft.period,
      label: 'Workout',
      vibrate: true,
      editing: false,
      puzzleImageId: 'custom_12345',
      puzzleImageType: 'custom',
      difficulty: 'hard',
      repeatDays: [],
    }),
  ).toEqual({
    id: undefined,
    hour: 7,
    minute: 0,
    enabled: true,
    vibrate: true,
    label: 'Workout',
    puzzleImageId: 'custom_12345',
    puzzleImageType: 'custom',
    difficulty: 'hard',
    repeatDays: [],
  });
});

test('preserves existing difficulty when editing alarm', () => {
  const alarm = {
    id: 'alarm-2',
    enabled: true,
    hour: 8,
    minute: 15,
    label: 'Focus',
    vibrate: true,
    difficulty: 'medium',
    repeatDays: ['sat', 'sun'],
  };
  const draft = initialEditorSelection(8, 15);
  expect(
    buildSavePayload({
      alarm,
      hour12: draft.hour12,
      minute: draft.minute,
      period: draft.period,
      label: 'Focus',
      vibrate: true,
      editing: true,
    }),
  ).toEqual({
    id: 'alarm-2',
    hour: 8,
    minute: 15,
    enabled: true,
    vibrate: true,
    label: 'Focus',
    puzzleImageId: 'moraine-lake',
    puzzleImageType: 'bundled',
    difficulty: 'medium',
    repeatDays: ['sat', 'sun'],
  });
});
