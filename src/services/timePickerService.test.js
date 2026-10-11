jest.mock('react-native', () => ({
  Platform: {OS: 'android'},
  NativeModules: {
    AlarmModule: {
      showTimePicker: jest.fn(),
    },
  },
}));

const {NativeModules, Platform} = require('react-native');
const {showRadialTimePicker} = require('./timePickerService');

const nativeBridge = NativeModules.AlarmModule;

beforeEach(() => {
  Platform.OS = 'android';
  nativeBridge.showTimePicker.mockReset();
});

test('delegates to AlarmModule with the draft clock and theme flag', async () => {
  nativeBridge.showTimePicker.mockResolvedValue({action: 'set', hour: 7, minute: 15});
  const result = await showRadialTimePicker({hour: 7, minute: 15, themeDark: true});
  expect(nativeBridge.showTimePicker).toHaveBeenCalledWith(7, 15, true);
  expect(result).toEqual({action: 'set', hour: 7, minute: 15});
});

test('rejects when the native picker bridge is unavailable', async () => {
  Platform.OS = 'ios';
  await expect(showRadialTimePicker({hour: 6, minute: 0, themeDark: false})).rejects.toThrow(
    'The radial time picker is only available on Android.',
  );
});
