import {NativeModules, Platform} from 'react-native';

const AlarmModule = NativeModules.AlarmModule;

export function showRadialTimePicker({hour, minute, themeDark}) {
  if (Platform.OS !== 'android' || !AlarmModule?.showTimePicker) {
    return Promise.reject(
      new Error('The radial time picker is only available on Android.'),
    );
  }
  return AlarmModule.showTimePicker(hour, minute, Boolean(themeDark));
}
