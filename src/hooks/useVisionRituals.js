import {useCallback, useEffect, useRef, useState} from 'react';
import {
  deleteAlarm,
  getVisionRituals,
  setAlarmEnabled,
} from '../services/alarmService';

export const MAX_VISION_RITUALS = 3;

export function useVisionRituals() {
  const [rituals, setRituals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const isMountedRef = useRef(true);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const list = await getVisionRituals();
      if (isMountedRef.current) {
        setRituals(Array.isArray(list) ? list : []);
        setError('');
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err?.message || 'Failed to load Vision Rituals.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    reload();
    return () => {
      isMountedRef.current = false;
    };
  }, [reload]);

  const toggleRitual = useCallback(
    async (id, currentEnabled) => {
      if (busyId) {return;}
      setBusyId(id);
      // Optimistic update
      setRituals(prev =>
        prev.map(r => (r.id === id ? {...r, enabled: !currentEnabled} : r)),
      );
      try {
        const updated = await setAlarmEnabled(id, !currentEnabled);
        if (isMountedRef.current) {
          setRituals(prev =>
            prev.map(r => (r.id === id ? {...r, ...updated} : r)),
          );
        }
      } catch (err) {
        if (isMountedRef.current) {
          // Revert optimistic update
          setRituals(prev =>
            prev.map(r => (r.id === id ? {...r, enabled: currentEnabled} : r)),
          );
          setError(err?.message || 'Failed to update ritual state.');
        }
      } finally {
        if (isMountedRef.current) {
          setBusyId(null);
        }
      }
    },
    [busyId],
  );

  const deleteRitual = useCallback(
    async id => {
      if (busyId) {return;}
      setBusyId(id);
      try {
        await deleteAlarm(id);
        if (isMountedRef.current) {
          setRituals(prev => prev.filter(r => r.id !== id));
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err?.message || 'Failed to delete ritual.');
        }
        throw err;
      } finally {
        if (isMountedRef.current) {
          setBusyId(null);
        }
      }
    },
    [busyId],
  );

  return {
    rituals,
    loading,
    error,
    busyId,
    reload,
    toggleRitual,
    deleteRitual,
    count: rituals.length,
    canAdd: rituals.length < MAX_VISION_RITUALS,
  };
}
