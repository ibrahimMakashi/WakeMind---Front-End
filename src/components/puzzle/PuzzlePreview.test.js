import React from 'react';
import {act, create} from 'react-test-renderer';
import {getDifficultyMeta, PuzzlePreview} from './PuzzlePreview';

jest.mock('@react-native-vector-icons/material-design-icons', () => 'MaterialDesignIcons');

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

jest.mock('../../theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      surface: '#151B2A',
      surfaceDeep: '#0B1020',
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

describe('PuzzlePreview Component', () => {
  test('returns correct difficulty metadata for easy, medium, and hard', () => {
    const easyMeta = getDifficultyMeta('easy');
    expect(easyMeta.side).toBe(3);
    expect(easyMeta.tiles).toBe(9);
    expect(easyMeta.label).toBe('NORMAL');

    const medMeta = getDifficultyMeta('medium');
    expect(medMeta.side).toBe(4);
    expect(medMeta.tiles).toBe(16);
    expect(medMeta.label).toBe('CHALLENGING');

    const hardMeta = getDifficultyMeta('hard');
    expect(hardMeta.side).toBe(5);
    expect(hardMeta.tiles).toBe(25);
    expect(hardMeta.label).toBe('HARDCORE');
  });

  test('renders image title and description for selected difficulty', () => {
    let tree;
    act(() => {
      tree = create(
        <PuzzlePreview
          difficulty="medium"
          imageSource={1}
          imageTitle="Sunrise Mountain"
          onChangeImage={jest.fn()}
          onEditImage={jest.fn()}
        />,
      );
    });

    const root = tree.root;
    expect(root.findByProps({children: 'Sunrise Mountain'})).toBeDefined();
    expect(
      root.findByProps({children: '4 × 4 grid • 16 tiles • Deep focus'}),
    ).toBeDefined();
  });

  test('calls onEditImage and onChangeImage when buttons are clicked', () => {
    const onEdit = jest.fn();
    const onChange = jest.fn();
    let tree;
    act(() => {
      tree = create(
        <PuzzlePreview
          difficulty="hard"
          imageSource={1}
          imageTitle="Goal Photo"
          onChangeImage={onChange}
          onEditImage={onEdit}
        />,
      );
    });

    const editBtn = tree.root.findByProps({accessibilityLabel: 'Edit or crop current puzzle image'});
    const changeBtn = tree.root.findByProps({accessibilityLabel: 'Change puzzle image'});

    act(() => {
      editBtn.props.onPress();
      changeBtn.props.onPress();
    });

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
