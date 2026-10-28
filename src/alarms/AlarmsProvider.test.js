import {act, create} from 'react-test-renderer';
import {Text} from 'react-native';
import {getAlarms, getCapabilityStatus, setAlarmEnabled} from '../services/alarmService';
import {AlarmsProvider, useAlarms} from './AlarmsProvider';

jest.mock('../services/alarmService', () => ({
  getAlarms: jest.fn(),
  getCapabilityStatus: jest.fn(),
  setAlarmEnabled: jest.fn(),
}));

const initialAlarms = [
  {id: 'a', enabled: false, label: 'A', hour: 9, minute: 0},
  {id: 'b', enabled: true, label: 'B', hour: 10, minute: 0},
];

function alarmById(id) {
  return api.alarms.find(alarm => alarm.id === id);
}

let api;
let renderer;

function Harness() {
  api = useAlarms();
  return <Text>{api.alarms.map(alarm => alarm.id).join(',')}</Text>;
}

async function renderAlarms() {
  getAlarms.mockResolvedValue(initialAlarms.map(alarm => ({...alarm})));
  getCapabilityStatus.mockResolvedValue(null);
  await act(async () => {
    renderer = create(
      <AlarmsProvider>
        <Harness />
      </AlarmsProvider>,
    );
  });
}

beforeEach(async () => {
  jest.clearAllMocks();
  await renderAlarms();
});

afterEach(() => {
  if (renderer) {
    act(() => {
      renderer.unmount();
    });
    renderer = null;
  }
});

test('rolls a failed toggle back to that alarm only', async () => {
  setAlarmEnabled.mockRejectedValue(new Error('schedule failed'));

  await act(async () => {
    await expect(api.toggleEnabled('a', true)).rejects.toThrow('schedule failed');
  });

  expect(alarmById('a')).toMatchObject({enabled: false, label: 'A'});
  expect(alarmById('b')).toMatchObject({enabled: true, label: 'B'});
});

test('keeps a newer alarm update when another toggle fails', async () => {
  let rejectA;
  let resolveB;
  setAlarmEnabled.mockImplementation((id, enabled) => {
    if (id === 'a') {
      return new Promise((_, reject) => {
        rejectA = reject;
      });
    }
    return new Promise(resolve => {
      resolveB = () =>
        resolve({id, enabled, label: 'B-saved', hour: 10, minute: 15});
    });
  });

  let pendingA;
  let pendingB;
  await act(async () => {
    pendingA = api.toggleEnabled('a', true);
    pendingB = api.toggleEnabled('b', false);
  });

  expect(alarmById('a').enabled).toBe(true);
  expect(alarmById('b').enabled).toBe(false);

  await act(async () => {
    resolveB();
    await pendingB;
  });

  await act(async () => {
    rejectA(new Error('a failed'));
    await expect(pendingA).rejects.toThrow('a failed');
  });

  expect(alarmById('a')).toMatchObject({enabled: false, label: 'A', hour: 9});
  expect(alarmById('b')).toEqual({
    id: 'b',
    enabled: false,
    label: 'B-saved',
    hour: 10,
    minute: 15,
  });
});

test('keeps refreshed alarm fields when a toggle fails', async () => {
  let rejectA;
  setAlarmEnabled.mockImplementation(
    () =>
      new Promise((_, reject) => {
        rejectA = reject;
      }),
  );

  let pendingA;
  await act(async () => {
    pendingA = api.toggleEnabled('a', true);
  });

  getAlarms.mockResolvedValue([
    {id: 'a', enabled: true, label: 'A-refreshed', hour: 9, minute: 30},
    {id: 'b', enabled: false, label: 'B-refreshed', hour: 11, minute: 0},
  ]);
  await act(async () => {
    await api.reload();
  });

  await act(async () => {
    rejectA(new Error('a failed'));
    await expect(pendingA).rejects.toThrow('a failed');
  });

  expect(alarmById('a')).toEqual({
    id: 'a',
    enabled: false,
    label: 'A-refreshed',
    hour: 9,
    minute: 30,
  });
  expect(alarmById('b')).toEqual({
    id: 'b',
    enabled: false,
    label: 'B-refreshed',
    hour: 11,
    minute: 0,
  });
});

test('does not restore an alarm a refresh already removed', async () => {
  let rejectA;
  setAlarmEnabled.mockImplementation(
    () =>
      new Promise((_, reject) => {
        rejectA = reject;
      }),
  );

  let pendingA;
  await act(async () => {
    pendingA = api.toggleEnabled('a', true);
  });

  getAlarms.mockResolvedValue([
    {id: 'b', enabled: true, label: 'B-only', hour: 10, minute: 0},
  ]);
  await act(async () => {
    await api.reload();
  });

  await act(async () => {
    rejectA(new Error('a failed'));
    await expect(pendingA).rejects.toThrow('a failed');
  });

  expect(api.alarms.map(alarm => alarm.id)).toEqual(['b']);
  expect(alarmById('b').label).toBe('B-only');
});
