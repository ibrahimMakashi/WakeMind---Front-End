export const DEFAULT_ALARM_SOUND_ID = 'gentle_morning';

export const ALARM_SOUNDS = [
  {
    id: 'gentle_morning',
    name: 'Gentle Morning',
    description: 'Soft and peaceful wake-up sound',
    duration: '0:06',
    category: 'Calm',
  },
  {
    id: 'classic_alarm',
    name: 'Classic Alarm',
    description: 'Traditional rhythmic alarm tone',
    duration: '0:06',
    category: 'Classic',
  },
  {
    id: 'deep_wake',
    name: 'Deep Wake',
    description: 'Low-frequency, strong wake-up tone',
    duration: '0:07',
    category: 'Resonant',
  },
  {
    id: 'nature_wake',
    name: 'Nature Wake',
    description: 'Calm acoustic organic chime melody',
    duration: '0:08',
    category: 'Nature',
  },
  {
    id: 'energetic_wake',
    name: 'Energetic Wake',
    description: 'Upbeat, bright electronic wake-up sequence',
    duration: '0:06',
    category: 'Energetic',
  },
];

export function findAlarmSound(id) {
  if (!id) {
    return ALARM_SOUNDS[0];
  }
  const norm = id.trim().toLowerCase();
  return ALARM_SOUNDS.find(s => s.id === norm) || ALARM_SOUNDS[0];
}

export function getAlarmSoundName(id) {
  return findAlarmSound(id).name;
}
