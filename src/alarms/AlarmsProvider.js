import {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {AppState, PermissionsAndroid, Platform} from 'react-native';
import {getAlarms, getCapabilityStatus, setAlarmEnabled} from '../services/alarmService';

const AlarmsContext = createContext(null);

export function AlarmsProvider({children}) {
  const [alarms, setAlarms] = useState([]);
  const [capability, setCapability] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  // Synchronous copy so overlapping toggles and reloads don't read a stale render.
  const alarmsRef = useRef([]);

  const commitAlarms = useCallback(update => {
    const next = update(alarmsRef.current);
    alarmsRef.current = next;
    setAlarms(next);
  }, []);

  const reload = useCallback(async () => {
    const [nextAlarms, nextCapability] = await Promise.all([
      getAlarms(),
      getCapabilityStatus(),
    ]);
    const list = Array.isArray(nextAlarms) ? nextAlarms : [];
    commitAlarms(() => list);
    setCapability(nextCapability);
    setLoadError('');
    return list;
  }, [commitAlarms]);

  useEffect(() => {
    let active = true;
    async function load(requestPermission) {
      try {
        if (
          requestPermission &&
          Platform.OS === 'android' &&
          Number(Platform.Version) >= 33
        ) {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
        }
        if (active) {
          await reload();
        }
      } catch (loadFailure) {
        if (active) {
          setLoadError(loadFailure.message || 'Alarms could not be loaded.');
        }
      }
    }
    load(true);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        load(false);
      }
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [reload]);

  const run = useCallback(
    async action => {
      setBusy(true);
      try {
        const result = await action();
        await reload();
        return result;
      } finally {
        setBusy(false);
      }
    },
    [reload],
  );

  const toggleEnabled = useCallback(async (id, enabled) => {
    const existing = alarmsRef.current.find(alarm => alarm.id === id);
    const previousEnabled = existing ? existing.enabled : enabled;

    commitAlarms(current =>
      current.map(alarm => (alarm.id === id ? {...alarm, enabled} : alarm)),
    );

    try {
      const updated = await setAlarmEnabled(id, enabled);
      commitAlarms(current =>
        current.map(alarm => (alarm.id === id ? updated : alarm)),
      );
      return updated;
    } catch (toggleError) {
      // Restore only this alarm's enabled flag. Other alarms may have changed
      // while the request was in flight, and those updates must stay.
      commitAlarms(current =>
        current.map(alarm =>
          alarm.id === id ? {...alarm, enabled: previousEnabled} : alarm,
        ),
      );
      throw toggleError;
    }
  }, [commitAlarms]);

  const value = {
    alarms,
    capability,
    loadError,
    busy,
    reload,
    run,
    toggleEnabled,
  };

  return (
    <AlarmsContext.Provider value={value}>{children}</AlarmsContext.Provider>
  );
}

export function useAlarms() {
  const value = useContext(AlarmsContext);
  if (!value) {
    throw new Error('useAlarms must be used within AlarmsProvider.');
  }
  return value;
}
