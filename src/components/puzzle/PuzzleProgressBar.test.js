import React from 'react';
import {Text} from 'react-native';
import {act, create} from 'react-test-renderer';
import {PuzzleProgressBar} from './PuzzleProgressBar';

jest.mock('../../theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      accent: '#FFB84D',
      surfaceDeep: '#151B2A',
      border: '#C5CDDC',
      muted: '#626B7D',
      textSoft: '#A6AEC1',
    },
    typography: {
      sectionLabel: {},
      caption: {},
    },
    radius: {
      pill: 999,
    },
  }),
}));

describe('PuzzleProgressBar', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  const dummyBoard = {
    size: 3,
    tiles: [
      {id: 't0', origin: 0, position: 0},
      {id: 't1', origin: 1, position: 1},
      {id: 't2', origin: 2, position: 3}, // misplaced
      {id: 't3', origin: 3, position: 2}, // misplaced
      {id: 't4', origin: 4, position: 4},
      {id: 't5', origin: 5, position: 5},
      {id: 't6', origin: 6, position: 6},
      {id: 't7', origin: 7, position: 7},
      {id: 't8', origin: 8, position: 8},
    ],
  };

  it('renders progress correctly when ready', () => {
    let renderer;
    act(() => {
      renderer = create(<PuzzleProgressBar board={dummyBoard} ready={true} />);
    });

    const textNodes = renderer.root.findAllByType(Text);
    const textStrings = textNodes.map(node =>
      Array.isArray(node.props.children)
        ? node.props.children.join('')
        : String(node.props.children),
    );

    expect(textStrings).toContain('7 / 9 tiles placed');
    expect(textStrings).toContain('78%');

    act(() => {
      renderer.unmount();
    });
  });

  it('suppresses false 100% flash when not ready', () => {
    const solvedBoard = {
      size: 3,
      tiles: Array.from({length: 9}, (_, i) => ({
        id: `t${i}`,
        origin: i,
        position: i,
      })),
    };

    let renderer;
    act(() => {
      renderer = create(<PuzzleProgressBar board={solvedBoard} ready={false} />);
    });

    const textNodes = renderer.root.findAllByType(Text);
    const textStrings = textNodes.map(node =>
      Array.isArray(node.props.children)
        ? node.props.children.join('')
        : String(node.props.children),
    );

    expect(textStrings).toContain('Preparing puzzle...');
    expect(textStrings).toContain('0%');
    expect(textStrings).not.toContain('100%');

    act(() => {
      renderer.unmount();
    });
  });
});
