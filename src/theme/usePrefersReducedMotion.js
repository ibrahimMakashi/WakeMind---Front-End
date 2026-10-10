import {useEffect, useState} from 'react';
import {AccessibilityInfo} from 'react-native';

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(enabled => {
        if (active) {
          setReduced(Boolean(enabled));
        }
      })
      .catch(readError => {
        console.warn(
          'Reduced motion preference could not be read.',
          readError && readError.message
            ? readError.message
            : 'Unknown accessibility failure.',
        );
      });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      enabled => {
        setReduced(Boolean(enabled));
      },
    );
    return () => {
      active = false;
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  }, []);

  return reduced;
}
