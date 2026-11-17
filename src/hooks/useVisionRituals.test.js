import {act, create} from 'react-test-renderer';
import * as alarmService from '../services/alarmService';
import {MAX_VISION_RITUALS, useVisionRituals} from './useVisionRituals';

jest.mock('../services/alarmService', () => ({
  getVisionRituals: jest.fn(),
  setAlarmEnabled: jest.fn(),
  deleteAlarm: jest.fn(),
}));

const ritualsRef = {current: null};

function Probe() {
  const state = useVisionRituals();
  ritualsRef.current = state;
  return null;
}

describe('useVisionRituals hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ritualsRef.current = null;
  });

  test('loads rituals and calculates count and canAdd limit', async () => {
    const mockRituals = [
      {id: 'r1', ritualText: 'Affirmation 1', repetitionTarget: 10, enabled: true},
      {id: 'r2', ritualText: 'Affirmation 2', repetitionTarget: 5, enabled: false},
    ];
    alarmService.getVisionRituals.mockResolvedValue(mockRituals);

    await act(async () => {
      create(<Probe />);
    });

    expect(ritualsRef.current.loading).toBe(false);
    expect(ritualsRef.current.rituals).toEqual(mockRituals);
    expect(ritualsRef.current.count).toBe(2);
    expect(ritualsRef.current.canAdd).toBe(true);
  });

  test('canAdd becomes false when maximum 3 rituals are reached', async () => {
    const mockRituals = [
      {id: 'r1', ritualText: 'Affirmation 1', repetitionTarget: 10, enabled: true},
      {id: 'r2', ritualText: 'Affirmation 2', repetitionTarget: 5, enabled: false},
      {id: 'r3', ritualText: 'Affirmation 3', repetitionTarget: 15, enabled: true},
    ];
    alarmService.getVisionRituals.mockResolvedValue(mockRituals);

    await act(async () => {
      create(<Probe />);
    });

    expect(ritualsRef.current.count).toBe(MAX_VISION_RITUALS);
    expect(ritualsRef.current.canAdd).toBe(false);
  });

  test('toggleRitual updates ritual enabled state', async () => {
    const mockRituals = [
      {id: 'r1', ritualText: 'Affirmation 1', repetitionTarget: 10, enabled: true},
    ];
    alarmService.getVisionRituals.mockResolvedValue(mockRituals);
    alarmService.setAlarmEnabled.mockResolvedValue({id: 'r1', enabled: false});

    await act(async () => {
      create(<Probe />);
    });

    await act(async () => {
      await ritualsRef.current.toggleRitual('r1', true);
    });

    expect(alarmService.setAlarmEnabled).toHaveBeenCalledWith('r1', false);
    expect(ritualsRef.current.rituals[0].enabled).toBe(false);
  });

  test('deleteRitual removes ritual from state', async () => {
    const mockRituals = [
      {id: 'r1', ritualText: 'Affirmation 1', repetitionTarget: 10, enabled: true},
    ];
    alarmService.getVisionRituals.mockResolvedValue(mockRituals);
    alarmService.deleteAlarm.mockResolvedValue(true);

    await act(async () => {
      create(<Probe />);
    });

    await act(async () => {
      await ritualsRef.current.deleteRitual('r1');
    });

    expect(alarmService.deleteAlarm).toHaveBeenCalledWith('r1');
    expect(ritualsRef.current.rituals).toEqual([]);
    expect(ritualsRef.current.count).toBe(0);
    expect(ritualsRef.current.canAdd).toBe(true);
  });
});
