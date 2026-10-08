import {NativeModules, Platform} from 'react-native';

const AlarmModule = NativeModules.AlarmModule;

function requireAndroidModule() {
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
