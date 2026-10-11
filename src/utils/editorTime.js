import {from24Hour, to24Hour} from './time';

export function initialEditorSelection(hour24, minute) {
  const clock = from24Hour(hour24);
  return {
    hour12: clock.hour12,
    minute,
    period: clock.period,
  };
}

export function applyConfirmedPickerResult(draft, result) {
  if (!result || result.action !== 'set') {
    return draft;
  }
  const clock = from24Hour(result.hour);
  return {
    hour12: clock.hour12,
    minute: result.minute,
    period: clock.period,
  };
}

export function buildSavePayload({alarm, hour12, minute, period, label, vibrate, editing}) {
  return {
    id: editing ? alarm.id : undefined,
    hour: to24Hour(hour12, period),
    minute,
    enabled: editing ? alarm.enabled : true,
    vibrate,
    label: label.trim(),
  };
}
