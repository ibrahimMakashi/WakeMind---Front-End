import {DEFAULT_PUZZLE_IMAGE_ID, DEFAULT_PUZZLE_IMAGE_TYPE} from '../puzzle/imageCatalog';
import {from24Hour, to24Hour} from './time';

export function initialEditorSelection(hour24, minute) {
  const clock = from24Hour(hour24);
  return {
    hour12: clock.hour12,
    minute,
    period: clock.period,
  };
}

export function applyConfirmedPickerResult(draft, result) {
  if (!result || result.action !== 'set') {
    return draft;
  }
  const clock = from24Hour(result.hour);
  return {
    hour12: clock.hour12,
    minute: result.minute,
    period: clock.period,
  };
}

export function buildSavePayload({
  alarm,
  hour12,
  minute,
  period,
  label,
  vibrate,
  editing,
  puzzleImageId,
  puzzleImageType,
  difficulty,
}) {
  const rawDifficulty = difficulty || alarm?.difficulty || 'easy';
  const validDifficulty =
    rawDifficulty === 'medium' || rawDifficulty === 'hard' ? rawDifficulty : 'easy';

  return {
    id: editing ? alarm.id : undefined,
    hour: to24Hour(hour12, period),
    minute,
    enabled: editing ? alarm.enabled : true,
    vibrate,
    label: label.trim(),
    puzzleImageId: puzzleImageId || alarm?.puzzleImageId || DEFAULT_PUZZLE_IMAGE_ID,
    puzzleImageType: puzzleImageType || alarm?.puzzleImageType || DEFAULT_PUZZLE_IMAGE_TYPE,
    difficulty: validDifficulty,
  };
}
