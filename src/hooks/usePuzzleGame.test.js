import {act, create} from 'react-test-renderer';
import {usePuzzleGame} from './usePuzzleGame';
import {isSolved} from '../puzzle/board';

const gameRef = {current: null};

function Probe() {
  const game = usePuzzleGame('easy');
  gameRef.current = game;
  return null;
}

test('rapid tap during animating is ignored', () => {
  act(() => {
    create(<Probe />);
  });
  act(() => {
    gameRef.current.setPhaseSafe('animating');
  });
  let tapResult;
  act(() => {
    tapResult = gameRef.current.applyTap('tile-0');
  });
  expect(tapResult).toBeNull();
});

test('markSolved locks interaction', () => {
  act(() => {
    create(<Probe />);
  });
  act(() => {
    gameRef.current.markSolved();
  });
  expect(gameRef.current.canInteract).toBe(false);
  expect(gameRef.current.phase).toBe('solved');
});

test('unlockAfterComplete resets move count and is unsolved', () => {
  act(() => {
    create(<Probe />);
  });
  act(() => {
    const next = gameRef.current.unlockAfterComplete(() => 0.1);
    expect(next.moveCount).toBe(0);
    expect(isSolved(next)).toBe(false);
  });
});
