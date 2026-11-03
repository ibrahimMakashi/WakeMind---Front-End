import React from 'react';
import {act, create} from 'react-test-renderer';
import {WakeUpVisionMissionCard} from './WakeUpVisionMissionCard';

jest.mock('@react-native-vector-icons/material-design-icons', () => 'MaterialDesignIcons');

jest.mock('../../theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      surface: '#151B2A',
      surfaceRaised: '#1E232A',
      surfaceDeep: '#0B1020',
      border: '#2C3447',
      text: '#F1F3FF',
      textSoft: '#A6AEC1',
      muted: '#718096',
      accent: '#FFB84D',
      accentText: '#10141A',
    },
    typography: {
      bodyStrong: {fontSize: 16, fontWeight: '700'},
      caption: {fontSize: 12},
    },
    radius: {
      sm: 8,
      md: 12,
      lg: 18,
      icon: 10,
      pill: 999,
    },
  }),
}));

describe('WakeUpVisionMissionCard', () => {
  test('renders title, image title, and difficulty choices', () => {
    let tree;
    act(() => {
      tree = create(
        <WakeUpVisionMissionCard
          currentImage={{
            id: 'mount-fuji',
            title: 'Mount Fuji',
            type: 'bundled',
            source: 1,
          }}
          difficulty="easy"
          onDifficultyChange={jest.fn()}
          onReplacePress={jest.fn()}
        />,
      );
    });

    const root = tree.root;
    expect(root.findByProps({children: 'Wake-Up Vision Mission'})).toBeDefined();
    expect(root.findByProps({children: 'LOCK ACTIVE'})).toBeDefined();
    expect(root.findByProps({children: 'Mount Fuji'})).toBeDefined();
    expect(root.findByProps({children: '9 Tiles (Standard)'})).toBeDefined();
    expect(root.findByProps({children: '3 × 3'})).toBeDefined();
    expect(root.findByProps({children: '4 × 4'})).toBeDefined();
    expect(root.findByProps({children: '5 × 5'})).toBeDefined();
  });

  test('calls onDifficultyChange when another difficulty is pressed', () => {
    const onDifficultyChange = jest.fn();
    let tree;
    act(() => {
      tree = create(
        <WakeUpVisionMissionCard
          currentImage={{id: 'moraine-lake', title: 'Moraine Lake', type: 'bundled', source: 1}}
          difficulty="easy"
          onDifficultyChange={onDifficultyChange}
          onReplacePress={jest.fn()}
        />,
      );
    });

    const mediumBtn = tree.root.findByProps({accessibilityLabel: '4 × 4 CHALLENGING difficulty'});
    act(() => {
      mediumBtn.props.onPress();
    });
    expect(onDifficultyChange).toHaveBeenCalledWith('medium');
  });

  test('calls onReplacePress when Replace is pressed', () => {
    const onReplacePress = jest.fn();
    let tree;
    act(() => {
      tree = create(
        <WakeUpVisionMissionCard
          currentImage={{id: 'moraine-lake', title: 'Moraine Lake', type: 'bundled', source: 1}}
          difficulty="easy"
          onDifficultyChange={jest.fn()}
          onReplacePress={onReplacePress}
        />,
      );
    });

    const replaceBtn = tree.root.findByProps({accessibilityLabel: 'Replace current image Moraine Lake'});
    act(() => {
      replaceBtn.props.onPress();
    });
    expect(onReplacePress).toHaveBeenCalledTimes(1);
  });
});
