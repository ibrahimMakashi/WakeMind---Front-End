import {
  hourPickerItems,
  initialEditorSelection,
  minutePickerItems,
  periodPickerItems,
  shouldCommitPickerValue,
} from './timePickerData';
import {to24Hour} from '../utils/time';

test('builds padded hour, minute, and period columns', () => {
  const hours = hourPickerItems();
  const minutes = minutePickerItems();
  expect(hours).toHaveLength(12);
  expect(hours[0]).toEqual({value: 1, label: '01'});
  expect(hours[11]).toEqual({value: 12, label: '12'});
  expect(minutes).toHaveLength(60);
  expect(minutes[0]).toEqual({value: 0, label: '00'});
  expect(minutes[59]).toEqual({value: 59, label: '59'});
  expect(periodPickerItems()).toEqual([
    {value: 'AM', label: 'AM'},
    {value: 'PM', label: 'PM'},
  ]);
});

test('initializes the editor from a saved 24-hour time', () => {
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
  expect(initialEditorSelection(6, 30)).toEqual({
    hour12: 6,
    minute: 30,
    period: 'AM',
  });
  expect(initialEditorSelection(18, 5)).toEqual({
    hour12: 6,
    minute: 5,
    period: 'PM',
  });
  expect(to24Hour(12, 'AM')).toBe(0);
  expect(to24Hour(12, 'PM')).toBe(12);
});

test('ignores picker events until the wheel is ready', () => {
  expect(shouldCommitPickerValue(false, 1, 6)).toBe(false);
  expect(shouldCommitPickerValue(true, 6, 6)).toBe(false);
  expect(shouldCommitPickerValue(true, null, 6)).toBe(false);
  expect(shouldCommitPickerValue(true, 7, 6)).toBe(true);
});
