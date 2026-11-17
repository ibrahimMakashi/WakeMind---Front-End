import React from 'react';
import {AccessibilityInfo, Vibration} from 'react-native';
import {act, create} from 'react-test-renderer';
import {AlarmQnaScreen} from './AlarmQnaScreen';

jest.mock('@react-native-vector-icons/material-design-icons', () => 'MaterialDesignIcons');

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 44, bottom: 34, left: 0, right: 0}),
}));

jest.mock('../../theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      background: '#070C16',
      surface: '#0E1420',
      surfaceRaised: '#121927',
      cardBorder: '#1E293B',
      borderSubtle: '#243046',
      line: '#1E293B',
      text: '#FFFFFF',
      textSoft: '#E2E8F0',
      textSubtle: '#94A3B8',
      muted: '#687690',
      accent: '#FFB84D',
      accentText: '#070C16',
      success: '#4CD964',
      error: '#E06B7A',
    },
  }),
}));

describe('AlarmQnaScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders first question and expected sentence in typing field initially', () => {
    const onComplete = jest.fn();
    let renderer;
    act(() => {
      renderer = create(<AlarmQnaScreen onComplete={onComplete} />);
    });

    const questionText = renderer.root.findByProps({testID: 'qna-question-text'});
    expect(questionText.props.children).toBe('What is your vision?');

    const input = renderer.root.findByProps({testID: 'qna-text-input'});
    expect(input.props.value).toBe('');

    const typingField = renderer.root.findByProps({testID: 'qna-typing-field'});
    expect(typingField).toBeDefined();

    expect(onComplete).not.toHaveBeenCalled();
  });

  test('exact case-sensitive, punctuation-sensitive answer advances to Question 2', () => {
    const onComplete = jest.fn();
    let renderer;
    act(() => {
      renderer = create(<AlarmQnaScreen onComplete={onComplete} />);
    });

    const input = renderer.root.findByProps({testID: 'qna-text-input'});

    // 1. Lowercase initial letter: "to live with discipline and purpose." -> should NOT advance
    act(() => {
      input.props.onChangeText('to live with discipline and purpose.');
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    let questionText = renderer.root.findByProps({testID: 'qna-question-text'});
    expect(questionText.props.children).toBe('What is your vision?');

    // 2. Missing final period: "To live with discipline and purpose" -> should NOT advance
    act(() => {
      input.props.onChangeText('To live with discipline and purpose');
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    questionText = renderer.root.findByProps({testID: 'qna-question-text'});
    expect(questionText.props.children).toBe('What is your vision?');

    // 3. Exact full sentence: "To live with discipline and purpose."
    act(() => {
      input.props.onChangeText('To live with discipline and purpose.');
    });

    // Advance past transition timer
    act(() => {
      jest.advanceTimersByTime(400);
    });

    // Now on Question 2!
    questionText = renderer.root.findByProps({testID: 'qna-question-text'});
    expect(questionText.props.children).toBe('Do you really want to achieve your goals?');
    expect(onComplete).not.toHaveBeenCalled();
  });

  test('completing all 5 full-sentence questions calls onComplete', () => {
    const onComplete = jest.fn();
    let renderer;
    act(() => {
      renderer = create(<AlarmQnaScreen onComplete={onComplete} />);
    });

    const fullSentenceAnswers = [
      'To live with discipline and purpose.',
      'Yes, with absolute commitment.',
      'Yes, action begins right now.',
      'Focus and execute with no excuses.',
      'Stronger, disciplined, and victorious.',
    ];

    fullSentenceAnswers.forEach(sentence => {
      const input = renderer.root.findByProps({testID: 'qna-text-input'});
      act(() => {
        input.props.onChangeText(sentence);
      });
      act(() => {
        jest.advanceTimersByTime(400);
      });
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('back press announces challenge in progress and does NOT skip or complete', () => {
    const onComplete = jest.fn();
    const announceSpy = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    const vibrateSpy = jest.spyOn(Vibration, 'vibrate');

    let renderer;
    act(() => {
      renderer = create(<AlarmQnaScreen onComplete={onComplete} />);
    });

    const backBtn = renderer.root.findByProps({accessibilityLabel: 'Back'});
    act(() => {
      backBtn.props.onPress();
    });

    expect(announceSpy).toHaveBeenCalledWith(
      expect.stringContaining('Alarm Q&A in progress'),
    );
    expect(vibrateSpy).toHaveBeenCalledWith(60);
    expect(onComplete).not.toHaveBeenCalled();
  });

  test('double advance guard prevents rapid keystrokes from skipping questions', () => {
    const onComplete = jest.fn();
    let renderer;
    act(() => {
      renderer = create(<AlarmQnaScreen onComplete={onComplete} />);
    });

    const input = renderer.root.findByProps({testID: 'qna-text-input'});

    // Enter correct answer with rapid duplicate events
    act(() => {
      input.props.onChangeText('To live with discipline and purpose.');
      input.props.onChangeText('To live with discipline and purpose.');
      input.props.onChangeText('To live with discipline and purpose.');
    });

    act(() => {
      jest.advanceTimersByTime(400);
    });

    // Should only have advanced to question 2 (index 1), not skipped
    const questionText = renderer.root.findByProps({testID: 'qna-question-text'});
    expect(questionText.props.children).toBe('Do you really want to achieve your goals?');
  });
});
