import React from 'react';
import {act, create} from 'react-test-renderer';
import {QnaCharacterRow} from './QnaCharacterRow';

jest.mock('../../theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      background: '#070C16',
      surface: '#0E1420',
      surfaceRaised: '#121927',
      text: '#FFFFFF',
      textSoft: '#E2E8F0',
      textSubtle: '#94A3B8',
      muted: '#687690',
      accent: '#FFB84D',
      success: '#4CD964',
      error: '#E06B7A',
      borderSubtle: '#243046',
    },
  }),
}));

describe('QnaCharacterRow Component', () => {
  test('renders expected characters as gray (not_typed) initially', () => {
    let renderer;
    act(() => {
      renderer = create(<QnaCharacterRow expectedAnswer="Earth" typedValue="" />);
    });

    const char0 = renderer.root.findByProps({testID: 'qna-char-0'});
    const char1 = renderer.root.findByProps({testID: 'qna-char-1'});
    const char2 = renderer.root.findByProps({testID: 'qna-char-2'});
    const char3 = renderer.root.findByProps({testID: 'qna-char-3'});
    const char4 = renderer.root.findByProps({testID: 'qna-char-4'});

    expect(char0.props.children).toBe('E');
    expect(char1.props.children).toBe('a');
    expect(char2.props.children).toBe('r');
    expect(char3.props.children).toBe('t');
    expect(char4.props.children).toBe('h');

    // All should be muted gray with opacity 0.6
    expect(char0.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({color: '#687690', opacity: 0.6}),
      ]),
    );
  });

  test('renders correct typed character in green and remaining in gray', () => {
    let renderer;
    act(() => {
      renderer = create(<QnaCharacterRow expectedAnswer="Earth" typedValue="E" />);
    });

    const char0 = renderer.root.findByProps({testID: 'qna-char-0'});
    const char1 = renderer.root.findByProps({testID: 'qna-char-1'});

    // First char: Correct ('E') -> Green (#4CD964)
    expect(char0.props.children).toBe('E');
    expect(char0.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({color: '#4CD964', opacity: 1}),
      ]),
    );

    // Second char: Not typed ('a') -> Gray (#687690)
    expect(char1.props.children).toBe('a');
    expect(char1.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({color: '#687690', opacity: 0.6}),
      ]),
    );
  });

  test('renders incorrect character in red and shows typed wrong character', () => {
    let renderer;
    act(() => {
      renderer = create(<QnaCharacterRow expectedAnswer="Earth" typedValue="Ex" />);
    });

    const char0 = renderer.root.findByProps({testID: 'qna-char-0'});
    const char1 = renderer.root.findByProps({testID: 'qna-char-1'});
    const char2 = renderer.root.findByProps({testID: 'qna-char-2'});

    // char 0: Correct 'E' -> green
    expect(char0.props.children).toBe('E');
    expect(char0.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({color: '#4CD964'}),
      ]),
    );

    // char 1: Wrong 'x' -> red
    expect(char1.props.children).toBe('x');
    expect(char1.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({color: '#E06B7A', opacity: 1}),
      ]),
    );

    // char 2: Not typed 'r' -> gray
    expect(char2.props.children).toBe('r');
    expect(char2.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({color: '#687690', opacity: 0.6}),
      ]),
    );
  });

  test('case-sensitive: lowercase typed character against uppercase expected is incorrect', () => {
    let renderer;
    act(() => {
      renderer = create(<QnaCharacterRow expectedAnswer="Earth" typedValue="earth" />);
    });

    const char0 = renderer.root.findByProps({testID: 'qna-char-0'});
    // 'e' !== 'E' -> red
    expect(char0.props.children).toBe('e');
    expect(char0.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({color: '#E06B7A'}),
      ]),
    );
  });

  test('extra characters typed beyond expected length render as incorrect red cells', () => {
    let renderer;
    act(() => {
      renderer = create(<QnaCharacterRow expectedAnswer="Hot" typedValue="Hott" />);
    });

    const char3 = renderer.root.findByProps({testID: 'qna-char-3'});
    expect(char3.props.children).toBe('t');
    expect(char3.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({color: '#E06B7A'}),
      ]),
    );
  });
});
