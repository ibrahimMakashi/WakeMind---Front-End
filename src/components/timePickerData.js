import {from24Hour} from '../utils/time';

export function hourPickerItems() {
  return Array.from({length: 12}, (_, index) => {
    const value = index + 1;
    return {value, label: String(value).padStart(2, '0')};
  });
}

export function minutePickerItems() {
  return Array.from({length: 60}, (_, index) => ({
    value: index,
    label: String(index).padStart(2, '0'),
  }));
}

export function periodPickerItems() {
  return [
    {value: 'AM', label: 'AM'},
    {value: 'PM', label: 'PM'},
  ];
}

export function initialEditorSelection(hour24, minute) {
  const clock = from24Hour(hour24);
  return {
    hour12: clock.hour12,
    minute,
    period: clock.period,
  };
}

export function shouldCommitPickerValue(ready, nextValue, currentValue) {
  return ready === true && nextValue != null && nextValue !== currentValue;
}
