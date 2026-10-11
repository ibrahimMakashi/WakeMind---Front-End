import {useCallback, useEffect, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';

const TICK_MS = 60000;

export function useCountdownTo(targetMillis) {
  const [now, setNow] = useState(() => Date.now());

  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
      const timer = setInterval(() => setNow(Date.now()), TICK_MS);
      return () => clearInterval(timer);
    }, []),
  );

  useEffect(() => {
    setNow(Date.now());
  }, [targetMillis]);

  return now;
}
