import {
  ALARM_SOUNDS,
  DEFAULT_ALARM_SOUND_ID,
  findAlarmSound,
  getAlarmSoundName,
} from './alarmSounds';

describe('alarmSounds catalog', () => {
  test('contains all 5 expected tunes with unique IDs', () => {
    expect(ALARM_SOUNDS.length).toBe(5);
    const ids = ALARM_SOUNDS.map(s => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(5);
    expect(ids).toContain('gentle_morning');
    expect(ids).toContain('classic_alarm');
    expect(ids).toContain('deep_wake');
    expect(ids).toContain('nature_wake');
    expect(ids).toContain('energetic_wake');
  });

  test('DEFAULT_ALARM_SOUND_ID is gentle_morning', () => {
    expect(DEFAULT_ALARM_SOUND_ID).toBe('gentle_morning');
  });

  test('findAlarmSound returns exact sound or falls back safely', () => {
    expect(findAlarmSound('classic_alarm').name).toBe('Classic Alarm');
    expect(findAlarmSound('DEEP_WAKE').id).toBe('deep_wake');
    expect(findAlarmSound(null).id).toBe('gentle_morning');
    expect(findAlarmSound('unknown_sound').id).toBe('gentle_morning');
  });

  test('getAlarmSoundName returns human-readable name', () => {
    expect(getAlarmSoundName('nature_wake')).toBe('Nature Wake');
    expect(getAlarmSoundName(undefined)).toBe('Gentle Morning');
  });
});
