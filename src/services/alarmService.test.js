import {NativeModules, Platform} from 'react-native';
import {
  canSnoozeAlarm,
  dismissAlarmAfterPuzzle,
  finishRingingActivity,
  getActiveRingingAlarm,
  getVisionRituals,
  playAudioPreview,
  saveVisionRitual,
  snoozeAlarm,
  stopAudioPreview,
  stopRinging,
} from './alarmService';

describe('alarmService', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    Platform.OS = 'android';
    NativeModules.AlarmModule = {
      getAlarms: jest.fn().mockResolvedValue([]),
      getVisionRituals: jest.fn().mockResolvedValue([]),
      saveAlarm: jest.fn().mockResolvedValue({id: 'test-1'}),
      saveVisionRitual: jest.fn().mockResolvedValue({id: 'ritual-1'}),
      setEnabled: jest.fn().mockResolvedValue({id: 'test-1', enabled: true}),
      deleteAlarm: jest.fn().mockResolvedValue(null),
      scheduleTestAlarm: jest.fn().mockResolvedValue({id: 'test-2'}),
      getCapabilityStatus: jest.fn().mockResolvedValue({exactAlarm: 'granted'}),
      openExactAlarmSettings: jest.fn().mockResolvedValue(null),
      openFullScreenIntentSettings: jest.fn().mockResolvedValue(null),
      stopRinging: jest.fn().mockResolvedValue(null),
      dismissAlarmOccurrenceAfterPuzzle: jest.fn().mockResolvedValue(true),
      finishRingingActivity: jest.fn().mockResolvedValue(true),
      getActiveRingingAlarm: jest.fn().mockResolvedValue({id: 'test-1'}),
      playAudioPreview: jest.fn().mockResolvedValue(true),
      stopAudioPreview: jest.fn().mockResolvedValue(true),
      canSnooze: jest.fn().mockResolvedValue(true),
      snoozeAlarm: jest.fn().mockResolvedValue(true),
    };
  });

  afterEach(() => {
    Platform.OS = originalPlatform;
  });

  test('delegates dismissAlarmAfterPuzzle to native AlarmModule with occurrenceId', async () => {
    const result = await dismissAlarmAfterPuzzle('alarm-123', 'occ-456');
    expect(NativeModules.AlarmModule.dismissAlarmOccurrenceAfterPuzzle).toHaveBeenCalledWith(
      'alarm-123',
      'occ-456',
    );
    expect(result).toBe(true);
  });

  test('delegates finishRingingActivity to native AlarmModule', async () => {
    const result = await finishRingingActivity();
    expect(NativeModules.AlarmModule.finishRingingActivity).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  test('rejects dismissAlarmAfterPuzzle when occurrenceId or alarmId is missing', () => {
    expect(() => dismissAlarmAfterPuzzle('alarm-123', '')).toThrow(
      'Both alarmId and occurrenceId are strictly required to dismiss an alarm.',
    );
    expect(() => dismissAlarmAfterPuzzle('', 'occ-456')).toThrow(
      'Both alarmId and occurrenceId are strictly required to dismiss an alarm.',
    );
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

  test('delegates playAudioPreview and stopAudioPreview to native AlarmModule', async () => {
    await playAudioPreview('gentle_morning');
    expect(NativeModules.AlarmModule.playAudioPreview).toHaveBeenCalledWith('gentle_morning');

    await stopAudioPreview();
    expect(NativeModules.AlarmModule.stopAudioPreview).toHaveBeenCalled();
  });

  test('delegates canSnoozeAlarm and snoozeAlarm to native AlarmModule', async () => {
    const can = await canSnoozeAlarm('alarm-123', 'occ-456');
    expect(NativeModules.AlarmModule.canSnooze).toHaveBeenCalledWith('alarm-123', 'occ-456');
    expect(can).toBe(true);

    const snoozed = await snoozeAlarm('alarm-123', 'occ-456');
    expect(NativeModules.AlarmModule.snoozeAlarm).toHaveBeenCalledWith('alarm-123', 'occ-456');
    expect(snoozed).toBe(true);
  });

  test('delegates getVisionRituals and saveVisionRitual to native AlarmModule', async () => {
    const list = await getVisionRituals();
    expect(NativeModules.AlarmModule.getVisionRituals).toHaveBeenCalled();
    expect(list).toEqual([]);

    const saved = await saveVisionRitual({hour: 7, minute: 30, ritualText: 'Focus'});
    expect(NativeModules.AlarmModule.saveVisionRitual).toHaveBeenCalledWith({
      hour: 7,
      minute: 30,
      ritualText: 'Focus',
    });
    expect(saved).toEqual({id: 'ritual-1'});
  });

  test('throws on non-Android platform', () => {
    Platform.OS = 'ios';
    expect(() => dismissAlarmAfterPuzzle('123', 'occ-123')).toThrow(
      'The alarm engine is only implemented on Android.',
    );
  });
});
