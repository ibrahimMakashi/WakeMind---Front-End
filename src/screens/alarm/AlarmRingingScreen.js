import React, {useCallback, useEffect, useRef, useState} from 'react';
import {BackHandler, StyleSheet, View} from 'react-native';
import {AlarmPuzzleScreen} from '../AlarmPuzzleScreen';
import {MissionActiveScreen} from './MissionActiveScreen';
import {MissionCompletionScreen} from './MissionCompletionScreen';
import {canSnoozeAlarm, dismissAlarmAfterPuzzle, snoozeAlarm} from '../../services/alarmService';
import {useTheme} from '../../theme/ThemeProvider';

export function AlarmRingingScreen({
  alarmId = '',
  occurrenceId = '',
  canSnooze: initialCanSnooze = true,
  label = 'Alarm',
  triggerAtMillis = Date.now(),
  puzzleImageId,
  puzzleImageType,
  difficulty = 'easy',
  sound = 'gentle_morning',
}) {
  const {colors} = useTheme();

  // State machine: 'mission' -> 'puzzle' -> 'completion'
  const [stage, setStage] = useState('mission');
  const [puzzleCompleted, setPuzzleCompleted] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const dismissingRef = useRef(false);
  const [snoozeAllowed, setSnoozeAllowed] = useState(initialCanSnooze);
  const [snoozing, setSnoozing] = useState(false);
  const [snoozeError, setSnoozeError] = useState('');

  // Suppress Android hardware back press across all ringing stages
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      return true;
    });
    return () => {
      subscription.remove();
    };
  }, []);

  // Sync snooze capability with native engine
  useEffect(() => {
    let active = true;
    if (alarmId && occurrenceId) {
      canSnoozeAlarm(alarmId, occurrenceId)
        .then(allowed => {
          if (active) {
            setSnoozeAllowed(allowed);
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [alarmId, occurrenceId]);

  // Stage 1 -> Stage 2: START WAKE MISSION
  const handleStartMission = useCallback(() => {
    setStage('puzzle');
  }, []);

  // Snooze handler
  const handleSnooze = useCallback(async () => {
    if (!snoozeAllowed || snoozing || isDismissing || dismissingRef.current) {
      return;
    }
    setSnoozing(true);
    setSnoozeError('');
    try {
      const result = await snoozeAlarm(alarmId, occurrenceId);
      if (!result) {
        setSnoozeError('Snooze limit reached');
        setSnoozeAllowed(false);
      }
    } catch (err) {
      setSnoozeError(err?.message || 'Could not snooze alarm');
    } finally {
      setSnoozing(false);
    }
  }, [alarmId, isDismissing, occurrenceId, snoozeAllowed, snoozing]);

  // Stage 2 -> Stage 3: Puzzle Solved (DO NOT dismiss alarm yet!)
  const handlePuzzleSolved = useCallback(() => {
    if (puzzleCompleted) {
      return;
    }
    setPuzzleCompleted(true);
    setStage('completion');
  }, [puzzleCompleted]);

  // Stage 3 -> Dismiss Alarm: Final CTA acknowledged by user
  const handleFinalDismiss = useCallback(async () => {
    if (dismissingRef.current) {
      return;
    }
    dismissingRef.current = true;
    setIsDismissing(true);
    try {
      const dismissed = await dismissAlarmAfterPuzzle(alarmId, occurrenceId);
      if (!dismissed) {
        console.warn(`Alarm final dismissal was rejected for alarmId=${alarmId}, occurrenceId=${occurrenceId}`);
        dismissingRef.current = false;
        setIsDismissing(false);
      }
    } catch (err) {
      console.warn('Alarm final dismissal error:', err);
      dismissingRef.current = false;
      setIsDismissing(false);
    }
  }, [alarmId, occurrenceId]);

  return (
    <View style={[styles.container, {backgroundColor: colors.background || '#070C16'}]}>
      {stage === 'mission' && (
        <MissionActiveScreen
          alarmId={alarmId}
          canSnooze={snoozeAllowed}
          difficulty={difficulty}
          label={label}
          occurrenceId={occurrenceId}
          onSnooze={handleSnooze}
          onStartMission={handleStartMission}
          snoozeError={snoozeError}
          snoozing={snoozing}
          sound={sound}
          triggerAtMillis={triggerAtMillis}
        />
      )}

      {stage === 'puzzle' && (
        <AlarmPuzzleScreen
          alarmId={alarmId}
          canSnooze={snoozeAllowed}
          difficulty={difficulty}
          label={label}
          occurrenceId={occurrenceId}
          onSolved={handlePuzzleSolved}
          puzzleImageId={puzzleImageId}
          puzzleImageType={puzzleImageType}
          triggerAtMillis={triggerAtMillis}
        />
      )}

      {stage === 'completion' && (
        <MissionCompletionScreen
          alarmId={alarmId}
          isDismissing={isDismissing}
          label={label}
          occurrenceId={occurrenceId}
          onDismiss={handleFinalDismiss}
          triggerAtMillis={triggerAtMillis}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
