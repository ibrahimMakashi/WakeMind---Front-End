import {
  applyConfirmedPickerResult,
  buildSavePayload,
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
    }),
  ).toEqual({
    id: undefined,
    hour: 12,
    minute: 0,
    enabled: true,
    vibrate: true,
    label: 'Alarm',
  });
});
