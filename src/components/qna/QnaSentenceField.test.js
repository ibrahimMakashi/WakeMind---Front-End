import React from 'react';
import {act, create} from 'react-test-renderer';
import {QnaSentenceField} from './QnaSentenceField';

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

describe('QnaSentenceField Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders expected sentence initially as muted gray text', () => {
    let renderer;
    act(() => {
      renderer = create(
        <QnaSentenceField
          expectedAnswer="We live on planet Earth."
          typedValue=""
        />,
      );
    });

    const field = renderer.root.findByProps({testID: 'qna-typing-field'});
    expect(field).toBeDefined();

    // Check first character 'W' is muted gray
    const char0 = renderer.root.findByProps({testID: 'qna-char-0'});
    expect(char0.props.children).toBe('W');
    expect(char0.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({color: '#687690', opacity: 0.65}),
      ]),
    );

    // Check last character '.' is also muted gray
    const charLast = renderer.root.findByProps({testID: 'qna-char-23'});
    expect(charLast.props.children).toBe('.');
    expect(charLast.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({color: '#687690', opacity: 0.65}),
      ]),
    );
  });

  test('correctly typed characters turn green and remaining characters stay gray', () => {
    let renderer;
    act(() => {
      renderer = create(
        <QnaSentenceField
          expectedAnswer="We live on planet Earth."
          typedValue="We "
        />,
      );
    });

    const char0 = renderer.root.findByProps({testID: 'qna-char-0'});
    const char1 = renderer.root.findByProps({testID: 'qna-char-1'});
    const char2 = renderer.root.findByProps({testID: 'qna-char-2'});
    const char3 = renderer.root.findByProps({testID: 'qna-char-3'});

    // 'W' -> green
    expect(char0.props.children).toBe('W');
    expect(char0.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({color: '#4CD964', opacity: 1}),
      ]),
    );

    // 'e' -> green
    expect(char1.props.children).toBe('e');
    expect(char1.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({color: '#4CD964', opacity: 1}),
      ]),
    );

    // ' ' -> green
    expect(char2.props.children).toBe(' ');
    expect(char2.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({color: '#4CD964', opacity: 1}),
      ]),
    );

    // 'l' (not typed yet) -> gray
    expect(char3.props.children).toBe('l');
    expect(char3.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({color: '#687690', opacity: 0.65}),
      ]),
    );
  });

  test('incorrect character displays in red with error highlight', () => {
    let renderer;
    act(() => {
      renderer = create(
        <QnaSentenceField
          expectedAnswer="We live on planet Earth."
          typedValue="We z"
        />,
      );
    });

    const char3 = renderer.root.findByProps({testID: 'qna-char-3'});

    // Expected was 'l', user typed 'z' -> displayed as 'z' in red
    expect(char3.props.children).toBe('z');
    expect(char3.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          color: '#E06B7A',
          backgroundColor: 'rgba(224, 107, 122, 0.24)',
          opacity: 1,
        }),
      ]),
    );
  });

  test('backspace removes incorrect character and restores expected character as gray', () => {
    let renderer;
    act(() => {
      renderer = create(
        <QnaSentenceField
          expectedAnswer="We live on planet Earth."
          typedValue="We z"
        />,
      );
    });

    // Check wrong character is 'z'
    expect(renderer.root.findByProps({testID: 'qna-char-3'}).props.children).toBe('z');

    // User backspaces 'z' -> typedValue becomes "We "
    act(() => {
      renderer.update(
        <QnaSentenceField
          expectedAnswer="We live on planet Earth."
          typedValue="We "
        />,
      );
    });

    // Now char 3 restores to expected 'l' in gray
    const restoredChar = renderer.root.findByProps({testID: 'qna-char-3'});
    expect(restoredChar.props.children).toBe('l');
    expect(restoredChar.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({color: '#687690', opacity: 0.65}),
      ]),
    );
  });

  test('case sensitivity: lowercase typed character against uppercase expected is incorrect', () => {
    let renderer;
    act(() => {
      renderer = create(
        <QnaSentenceField
          expectedAnswer="We live on planet Earth."
          typedValue="we"
        />,
      );
    });

    const char0 = renderer.root.findByProps({testID: 'qna-char-0'});
    // Expected 'W', typed 'w' -> incorrect (red)
    expect(char0.props.children).toBe('w');
    expect(char0.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({color: '#E06B7A'}),
      ]),
    );
  });

  test('punctuation is required: final period matches when typed', () => {
    let renderer;
    const fullSentence = 'We live on planet Earth.';
    const almostDone = 'We live on planet Earth';

    act(() => {
      renderer = create(
        <QnaSentenceField
          expectedAnswer={fullSentence}
          typedValue={almostDone}
        />,
      );
    });

    // Period is at index 23, still gray
    const periodChar = renderer.root.findByProps({testID: 'qna-char-23'});
    expect(periodChar.props.children).toBe('.');
    expect(periodChar.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({color: '#687690', opacity: 0.65}),
      ]),
    );

    // Now type the period
    act(() => {
      renderer.update(
        <QnaSentenceField
          expectedAnswer={fullSentence}
          typedValue={fullSentence}
        />,
      );
    });

    // Period is now green!
    const completedPeriod = renderer.root.findByProps({testID: 'qna-char-23'});
    expect(completedPeriod.props.children).toBe('.');
    expect(completedPeriod.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({color: '#4CD964'}),
      ]),
    );
  });
});
