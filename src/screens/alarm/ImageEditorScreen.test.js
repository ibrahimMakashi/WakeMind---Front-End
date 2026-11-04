import React from 'react';
import {act, create} from 'react-test-renderer';
import {ImageEditorScreen} from './ImageEditorScreen';
import * as imageStorage from '../../puzzle/imageStorage';

jest.mock('@react-native-vector-icons/material-design-icons', () => 'MaterialDesignIcons');

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: jest.fn(),
    canGoBack: () => true,
  }),
  useRoute: () => ({
    params: {},
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

jest.mock('../../theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      background: '#0B1020',
      surface: '#151B2A',
      border: '#2C3447',
      text: '#F1F3FF',
      textSoft: '#A6AEC1',
      muted: '#718096',
      accent: '#FFB84D',
      accentText: '#10141A',
    },
    typography: {
      screenTitle: {fontSize: 20, fontWeight: '700'},
      bodyStrong: {fontSize: 16, fontWeight: '700'},
      caption: {fontSize: 12},
      button: {fontSize: 14, fontWeight: '700'},
    },
    radius: {
      sm: 8,
      md: 12,
      lg: 18,
      pill: 999,
    },
  }),
}));

describe('ImageEditorScreen', () => {
  const sampleImage = {
    uri: 'file:///sample/photo.jpg',
    width: 1200,
    height: 800,
    title: 'Test Photo',
  };

  test('renders crop header and action controls', () => {
    let tree;
    act(() => {
      tree = create(
        <ImageEditorScreen
          image={sampleImage}
          onApply={jest.fn()}
          onCancel={jest.fn()}
        />,
      );
    });

    const root = tree.root;
    expect(root.findByProps({children: 'Crop & Position Photo'})).toBeDefined();
    expect(root.findByProps({children: 'Apply'})).toBeDefined();
    expect(root.findByProps({children: 'Reset'})).toBeDefined();
  });

  test('calls onCancel when Cancel is pressed', () => {
    const onCancel = jest.fn();
    let tree;
    act(() => {
      tree = create(
        <ImageEditorScreen
          image={sampleImage}
          onApply={jest.fn()}
          onCancel={onCancel}
        />,
      );
    });

    const cancelBtn = tree.root.findByProps({accessibilityLabel: 'Cancel crop'});
    act(() => {
      cancelBtn.props.onPress();
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('crops and calls onApply with processed image result', async () => {
    const onApply = jest.fn();
    jest.spyOn(imageStorage, 'cropSquareImage').mockResolvedValueOnce({
      id: 'custom_123',
      uri: 'file:///data/puzzle_images/custom_123.jpg',
      width: 1024,
      height: 1024,
    });
    jest.spyOn(imageStorage, 'recordRecentImage').mockResolvedValueOnce([]);

    let tree;
    act(() => {
      tree = create(
        <ImageEditorScreen
          image={sampleImage}
          onApply={onApply}
          onCancel={jest.fn()}
        />,
      );
    });

    const applyBtn = tree.root.findByProps({accessibilityLabel: 'Apply crop'});
    await act(async () => {
      await applyBtn.props.onPress();
    });

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'custom_123',
        type: 'custom',
        uri: 'file:///data/puzzle_images/custom_123.jpg',
      }),
    );
  });
});
