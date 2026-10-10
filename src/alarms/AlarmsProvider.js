import {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {AppState, PermissionsAndroid, Platform} from 'react-native';
import {getAlarms, getCapabilityStatus} from '../services/alarmService';

const AlarmsContext = createContext(null);

export function AlarmsProvider({children}) {
  const [alarms, setAlarms] = useState([]);
  const [capability, setCapability] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const [nextAlarms, nextCapability] = await Promise.all([
      getAlarms(),
      getCapabilityStatus(),
    ]);
    setAlarms(Array.isArray(nextAlarms) ? nextAlarms : []);
    setCapability(nextCapability);
    setLoadError('');
    return nextAlarms;
  }, []);

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

  const value = {
    alarms,
    capability,
    loadError,
    busy,
    reload,
    run,
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
