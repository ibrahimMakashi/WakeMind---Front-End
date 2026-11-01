import React from 'react';
import {act, create} from 'react-test-renderer';
import {ImageGalleryModal} from './ImageGalleryModal';

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
      accentText: '#10141A',
      overlay: 'rgba(0,0,0,0.65)',
    },
    typography: {
      screenTitle: {fontSize: 18},
      sectionLabel: {fontSize: 12},
      caption: {fontSize: 12},
      bodyStrong: {fontSize: 16, fontWeight: '700'},
    },
    radius: {
      sm: 8,
      md: 12,
      lg: 16,
      pill: 999,
    },
  }),
}));

describe('ImageGalleryModal', () => {
  test('renders bundled artwork presets', () => {
    let tree;
    act(() => {
      tree = create(
        <ImageGalleryModal
          currentImageId="moraine-lake"
          onChooseFromPhone={jest.fn()}
          onClose={jest.fn()}
          onSelectBundled={jest.fn()}
          visible={true}
        />,
      );
    });

    const root = tree.root;
    expect(root.findByProps({children: 'DEFAULT ARTWORK'})).toBeDefined();
    expect(root.findByProps({children: 'Moraine Lake'})).toBeDefined();
    expect(root.findByProps({children: 'Mount Fuji'})).toBeDefined();
    expect(root.findByProps({children: 'Yosemite Valley'})).toBeDefined();
  });

  test('renders recently selected section when recents are provided', () => {
    const onSelectRecent = jest.fn();
    const recents = [
      {id: 'mount-fuji', type: 'bundled', title: 'Mount Fuji', timestamp: 100},
      {id: 'custom_1', type: 'custom', title: 'Family Picnic', uri: 'file:///picnic.jpg', timestamp: 200},
    ];

    let tree;
    act(() => {
      tree = create(
        <ImageGalleryModal
          currentImageId="custom_1"
          onChooseFromPhone={jest.fn()}
          onClose={jest.fn()}
          onSelectBundled={jest.fn()}
          onSelectRecent={onSelectRecent}
          recentImages={recents}
          visible={true}
        />,
      );
    });

    const root = tree.root;
    expect(root.findByProps({children: 'RECENTLY SELECTED'})).toBeDefined();
    expect(root.findByProps({children: 'Family Picnic'})).toBeDefined();

    const recentItem = root.findByProps({accessibilityLabel: 'Select recent Family Picnic'});
    act(() => {
      recentItem.props.onPress();
    });
    expect(onSelectRecent).toHaveBeenCalledTimes(1);
    expect(onSelectRecent).toHaveBeenCalledWith(
      expect.objectContaining({id: 'custom_1', type: 'custom', title: 'Family Picnic'}),
    );
  });
});
