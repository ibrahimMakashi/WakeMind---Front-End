import React from 'react';
import {act, create} from 'react-test-renderer';
import {LandingScreen} from './LandingScreen';

const mockReplace = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('@react-native-vector-icons/material-design-icons', () => 'MaterialDesignIcons');

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 40, bottom: 20, left: 0, right: 0}),
}));

jest.mock('../theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      background: '#070C16',
      surface: '#0E1420',
      surfaceRaised: '#121927',
      surfaceDeep: '#151E2E',
      text: '#FFFFFF',
      textSoft: '#E2E8F0',
      textSubtle: '#94A3B8',
      muted: '#687690',
      accent: '#FFB84D',
      accentText: '#070C16',
      border: '#1E293B',
      borderSubtle: '#243046',
    },
    typography: {
      brandTitle: {fontSize: 18},
      brandSubtitle: {fontSize: 11},
      cardHeading: {fontSize: 11},
      caption: {fontSize: 11},
    },
    radius: {
      card: 20,
      lg: 20,
      pill: 999,
    },
  }),
}));

describe('LandingScreen', () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  test('renders branding, foundational truth quote, and CTA button', () => {
    let tree;
    act(() => {
      tree = create(<LandingScreen />);
    });

    const root = tree.root;
    expect(root.findByProps({children: 'SYSTEM ARMED'})).toBeDefined();
    expect(root.findByProps({children: 'B - DISCIPLINE'})).toBeDefined();
    expect(root.findByProps({children: 'DAWN ADHERENCE PROTOCOL'})).toBeDefined();
    expect(root.findByProps({children: 'FOUNDATIONAL TRUTH'})).toBeDefined();
    expect(
      root.findByProps({
        children: '"The curse of discipline is that every day looks the same.',
      }),
    ).toBeDefined();
    expect(
      root.findByProps({
        children: 'The curse of indiscipline is that every year looks the same."',
      }),
    ).toBeDefined();
    expect(root.findByProps({children: '— Unknown'})).toBeDefined();
    expect(root.findByProps({children: 'BEGIN MY DISCIPLINE JOURNEY'})).toBeDefined();
  });

  test('tapping CTA navigates to MainTabs via replace', () => {
    let tree;
    act(() => {
      tree = create(<LandingScreen />);
    });

    const ctaButton = tree.root.findByProps({
      accessibilityLabel: 'Begin my discipline journey',
    });
    act(() => {
      ctaButton.props.onPress();
    });

    expect(mockReplace).toHaveBeenCalledWith('Main');
  });
});
