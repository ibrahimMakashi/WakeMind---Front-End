import {NativeModules, Platform} from 'react-native';
import {
  dismissAlarmAfterPuzzle,
  getActiveRingingAlarm,
  stopRinging,
} from './alarmService';

describe('alarmService', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    Platform.OS = 'android';
    NativeModules.AlarmModule = {
      getAlarms: jest.fn().mockResolvedValue([]),
      saveAlarm: jest.fn().mockResolvedValue({id: 'test-1'}),
      setEnabled: jest.fn().mockResolvedValue({id: 'test-1', enabled: true}),
      deleteAlarm: jest.fn().mockResolvedValue(null),
      scheduleTestAlarm: jest.fn().mockResolvedValue({id: 'test-2'}),
      getCapabilityStatus: jest.fn().mockResolvedValue({exactAlarm: 'granted'}),
      openExactAlarmSettings: jest.fn().mockResolvedValue(null),
      openFullScreenIntentSettings: jest.fn().mockResolvedValue(null),
      stopRinging: jest.fn().mockResolvedValue(null),
      dismissAlarmAfterPuzzle: jest.fn().mockResolvedValue(true),
      getActiveRingingAlarm: jest.fn().mockResolvedValue({id: 'test-1'}),
    };
  });

  afterEach(() => {
    Platform.OS = originalPlatform;
  });

  test('delegates dismissAlarmAfterPuzzle to native AlarmModule', async () => {
    const result = await dismissAlarmAfterPuzzle('alarm-123');
    expect(NativeModules.AlarmModule.dismissAlarmAfterPuzzle).toHaveBeenCalledWith('alarm-123');
    expect(result).toBe(true);
  });

  test('delegates stopRinging to native AlarmModule', async () => {
    await stopRinging();
    expect(NativeModules.AlarmModule.stopRinging).toHaveBeenCalled();
  });

  test('delegates getActiveRingingAlarm to native AlarmModule', async () => {
    const active = await getActiveRingingAlarm();
    expect(NativeModules.AlarmModule.getActiveRingingAlarm).toHaveBeenCalled();
    expect(active.id).toBe('test-1');
  });

  test('throws on non-Android platform', () => {
    Platform.OS = 'ios';
    expect(() => dismissAlarmAfterPuzzle('123')).toThrow(
      'The alarm engine is only implemented on Android.',
    );
  });
});
