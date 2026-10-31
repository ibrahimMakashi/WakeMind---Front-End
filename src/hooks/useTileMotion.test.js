import {act, create} from 'react-test-renderer';
import {useTileMotion} from './useTileMotion';
import {createSolvedBoard} from '../puzzle/board';
import {createLayout} from '../puzzle/layout';

describe('useTileMotion lifecycle & safety guards', () => {
  test('returns stable object reference across re-renders with same reducedMotion', () => {
    let hookResult;
    let renderCount = 0;

    function TestComponent({count}) {
      renderCount += 1;
      hookResult = useTileMotion(false);
      return null;
    }

    let root;
    act(() => {
      root = create(<TestComponent count={1} />);
    });
    const firstMotion = hookResult;

    act(() => {
      root.update(<TestComponent count={2} />);
    });
    const secondMotion = hookResult;

    expect(renderCount).toBe(2);
    // Crucial: API object must be memoized and stable
    expect(secondMotion).toBe(firstMotion);
    expect(secondMotion.getMotion).toBe(firstMotion.getMotion);
    expect(secondMotion.snapToBoard).toBe(firstMotion.snapToBoard);
    expect(secondMotion.animateGrab).toBe(firstMotion.animateGrab);
    expect(secondMotion.animateSwap).toBe(firstMotion.animateSwap);
  });

  test('tile Animated.Value instances remain stable across re-renders', () => {
    let motionApi;
    const board = createSolvedBoard(3);
    const layout = createLayout(300, 3);

    function TestComponent() {
      motionApi = useTileMotion(false);
      return null;
    }

    let root;
    act(() => {
      root = create(<TestComponent />);
    });

    motionApi.ensureMap(board);
    motionApi.snapToBoard(board, layout);

    const tile0Motion = motionApi.getMotion('tile-0');
    const origDrag = tile0Motion.drag;
    const origPos = tile0Motion.position;
    const origScale = tile0Motion.scale;

    act(() => {
      root.update(<TestComponent />);
    });

    const tile0MotionAfter = motionApi.getMotion('tile-0');
    expect(tile0MotionAfter.drag).toBe(origDrag);
    expect(tile0MotionAfter.position).toBe(origPos);
    expect(tile0MotionAfter.scale).toBe(origScale);
  });

  test('snapToBoard does not overwrite active dragging tile', () => {
    let motionApi;
    const board = createSolvedBoard(3);
    const layout = createLayout(300, 3);

    function TestComponent() {
      motionApi = useTileMotion(false);
      return null;
    }

    act(() => {
      create(<TestComponent />);
    });

    motionApi.ensureMap(board);
    motionApi.snapToBoard(board, layout);

    // Simulate drag start on tile-0 with an active drag offset
    motionApi.setActiveDrag('tile-0');
    const tile0Motion = motionApi.getMotion('tile-0');
    tile0Motion.drag.setValue({x: 55, y: 40});

    // An ordinary snapToBoard call (such as from a re-render) must be guarded
    motionApi.snapToBoard(board, layout);

    expect(tile0Motion.drag.x._value).toBe(55);
    expect(tile0Motion.drag.y._value).toBe(40);

    // Other tiles that are not dragging are snapped normally
    const tile1Motion = motionApi.getMotion('tile-1');
    expect(tile1Motion.drag.x._value).toBe(0);
    expect(tile1Motion.drag.y._value).toBe(0);

    // Clearing active drag allows normal snapping
    motionApi.setActiveDrag(null);
    motionApi.snapToBoard(board, layout);
    expect(tile0Motion.drag.x._value).toBe(0);
    expect(tile0Motion.drag.y._value).toBe(0);
  });

  test('snapToBoard does not overwrite tiles undergoing swap animation', async () => {
    let motionApi;
    const board = createSolvedBoard(3);
    const layout = createLayout(300, 3);

    function TestComponent() {
      motionApi = useTileMotion(false);
      return null;
    }

    act(() => {
      create(<TestComponent />);
    });

    motionApi.ensureMap(board);
    motionApi.snapToBoard(board, layout);

    const tile0Motion = motionApi.getMotion('tile-0');

    // Start swap animation between tile-0 and tile-1
    const swapPromise = motionApi.animateSwap(
      board,
      layout,
      'tile-0',
      'tile-1',
      {x: 0, y: 0},
      {x: 100, y: 0},
      {dx: 80, dy: 5},
    );

    // While swap animation is in flight, call snapToBoard
    motionApi.snapToBoard(board, layout);

    // Force option overrides the safety guard when needed (e.g. difficulty reset)
    motionApi.snapToBoard(board, layout, {force: true});
    expect(tile0Motion.drag.x._value).toBe(0);

    await swapPromise;
  });
});
