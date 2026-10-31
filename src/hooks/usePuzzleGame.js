import {useCallback, useRef, useState} from 'react';
import {
  createPuzzleForDifficulty,
  createSolvedBoard,
  gridSizeForDifficulty,
  isSolved,
} from '../puzzle/board';
import {dropTile, shuffleSession, tapTile} from '../puzzle/session';

/**
 * @typedef {'idle'|'animating'|'solved'} PuzzlePhase
 */

export function usePuzzleGame(initialDifficulty = 'easy') {
  const [difficulty, setDifficultyState] = useState(initialDifficulty);
  const size = gridSizeForDifficulty(difficulty);
  const [board, setBoard] = useState(() => createSolvedBoard(size));
  const boardRef = useRef(board);
  const [phase, setPhase] = useState('idle');

  const syncBoard = useCallback(next => {
    boardRef.current = next;
    setBoard(next);
  }, []);

  const setPhaseSafe = useCallback(next => {
    setPhase(next);
  }, []);

  const canInteract = phase === 'idle';

  const applyTap = useCallback(
    tileId => {
      if (!canInteract) {
        return null;
      }
      const result = tapTile(boardRef.current, tileId);
      syncBoard(result.board);
      return result;
    },
    [canInteract, syncBoard],
  );

  const applyDrop = useCallback(
    (dragId, targetId) => {
      if (!canInteract) {
        return null;
      }
      const before = boardRef.current;
      const result = dropTile(before, dragId, targetId);
      syncBoard(result.board);
      return {...result, before};
    },
    [canInteract, syncBoard],
  );

  const applyShuffle = useCallback(
    random => {
      const next = shuffleSession(boardRef.current, random);
      syncBoard(next);
      return next;
    },
    [syncBoard],
  );

  const replaceBoard = useCallback(
    next => {
      syncBoard(next);
    },
    [syncBoard],
  );

  const startNewDifficulty = useCallback(
    nextDifficulty => {
      const nextSize = gridSizeForDifficulty(nextDifficulty);
      setDifficultyState(nextDifficulty);
      const solved = createSolvedBoard(nextSize);
      syncBoard(solved);
      setPhase('idle');
      return solved;
    },
    [syncBoard],
  );

  const checkSolved = useCallback(() => isSolved(boardRef.current), []);

  const markSolved = useCallback(() => {
    setPhase('solved');
  }, []);

  const unlockAfterComplete = useCallback(
    random => {
      const next = createPuzzleForDifficulty(difficulty, random);
      syncBoard(next);
      setPhase('idle');
      return next;
    },
    [difficulty, syncBoard],
  );

  return {
    board,
    boardRef,
    difficulty,
    phase,
    canInteract,
    applyTap,
    applyDrop,
    applyShuffle,
    replaceBoard,
    startNewDifficulty,
    checkSolved,
    markSolved,
    unlockAfterComplete,
    setPhaseSafe,
  };
}
