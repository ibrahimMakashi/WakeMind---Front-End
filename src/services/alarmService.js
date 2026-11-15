import {NativeModules, Platform} from 'react-native';

function requireAndroidModule() {
  const AlarmModule = NativeModules.AlarmModule;
  if (Platform.OS !== 'android' || !AlarmModule) {
    throw new Error('The alarm engine is only implemented on Android.');
  }
  return AlarmModule;
}

export function getAlarms() {
  return requireAndroidModule().getAlarms();
}

export function saveAlarm(alarm) {
  return requireAndroidModule().saveAlarm(alarm);
}

export function setAlarmEnabled(id, enabled) {
  return requireAndroidModule().setEnabled(id, enabled);
}

export function deleteAlarm(id) {
  return requireAndroidModule().deleteAlarm(id);
}

export function scheduleTestAlarm(offsetSeconds) {
  return requireAndroidModule().scheduleTestAlarm(offsetSeconds);
}

export function getCapabilityStatus() {
  return requireAndroidModule().getCapabilityStatus();
}

export function openExactAlarmSettings() {
  return requireAndroidModule().openExactAlarmSettings();
}

export function openFullScreenIntentSettings() {
  return requireAndroidModule().openFullScreenIntentSettings();
}

export function stopRinging() {
  return requireAndroidModule().stopRinging();
}

export function dismissAlarmAfterPuzzle(alarmId, occurrenceId) {
  if (!alarmId || !occurrenceId) {
    throw new Error('Both alarmId and occurrenceId are strictly required to dismiss an alarm.');
  }
  return requireAndroidModule().dismissAlarmOccurrenceAfterPuzzle(alarmId, occurrenceId);
}

export function canSnoozeAlarm(alarmId, occurrenceId) {
  const mod = requireAndroidModule();
  if (typeof mod.canSnooze === 'function') {
    return mod.canSnooze(alarmId, occurrenceId);
  }
  return Promise.resolve(false);
}

export function snoozeAlarm(alarmId, occurrenceId) {
  return requireAndroidModule().snoozeAlarm(alarmId, occurrenceId);
}

export function getActiveRingingAlarm() {
  return requireAndroidModule().getActiveRingingAlarm();
}

export function playAudioPreview(soundId) {
  const mod = requireAndroidModule();
  if (typeof mod.playAudioPreview === 'function') {
    return mod.playAudioPreview(soundId);
  }
  return Promise.resolve(true);
}

export function stopAudioPreview() {
  const mod = requireAndroidModule();
  if (typeof mod.stopAudioPreview === 'function') {
    return mod.stopAudioPreview();
  }
  return Promise.resolve(true);
}
