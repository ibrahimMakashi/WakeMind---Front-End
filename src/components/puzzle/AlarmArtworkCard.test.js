import React from 'react';
import {act, create} from 'react-test-renderer';
import {AlarmArtworkCard} from './AlarmArtworkCard';

jest.mock('@react-native-vector-icons/material-design-icons', () => 'MaterialDesignIcons');

jest.mock('../../theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      surface: '#1E232A',
      surfaceRaised: '#2A303C',
      border: '#3D4452',
      text: '#FFFFFF',
      textSoft: '#A0AEC0',
      muted: '#718096',
      accent: '#FFB300',
    },
    typography: {
      sectionLabel: {fontSize: 12},
      caption: {fontSize: 12},
      bodyStrong: {fontSize: 16, fontWeight: '700'},
    },
    radius: {
      sm: 8,
      md: 12,
      pill: 999,
    },
  }),
}));

describe('AlarmArtworkCard', () => {
  test('renders assigned artwork title and subtitle', () => {
    let tree;
    act(() => {
      tree = create(
        <AlarmArtworkCard
          currentImage={{
            id: 'mount-fuji',
            title: 'Mount Fuji',
            type: 'bundled',
            source: {uri: 'fuji.png'},
          }}
          onChangePress={jest.fn()}
        />,
      );
    });

    const root = tree.root;
    expect(root.findByProps({children: 'PUZZLE CHALLENGE'})).toBeDefined();
    expect(root.findByProps({children: 'Mount Fuji'})).toBeDefined();
    expect(root.findByProps({children: '3×3 Puzzle Image'})).toBeDefined();
    expect(root.findByProps({children: 'Change'})).toBeDefined();
  });

  test('calls onChangePress when change button is pressed', () => {
    const onChangePress = jest.fn();
    let tree;
    act(() => {
      tree = create(
        <AlarmArtworkCard
          currentImage={{
            id: 'moraine-lake',
            title: 'Moraine Lake',
            type: 'bundled',
            source: 1,
          }}
          onChangePress={onChangePress}
        />,
      );
    });

    const changeButton = tree.root.findByProps({accessibilityLabel: 'Change puzzle artwork. Current artwork: Moraine Lake'});
    act(() => {
      changeButton.props.onPress();
    });
    expect(onChangePress).toHaveBeenCalledTimes(1);
  });
});
