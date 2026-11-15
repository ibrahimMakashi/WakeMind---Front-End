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

  test('renders first question and progress header initially', () => {
    const onComplete = jest.fn();
    let renderer;
    act(() => {
      renderer = create(<AlarmQnaScreen onComplete={onComplete} />);
    });

    const questionText = renderer.root.findByProps({testID: 'qna-question-text'});
    expect(questionText.props.children).toBe('What planet do we live on?');

    const input = renderer.root.findByProps({testID: 'qna-text-input'});
    expect(input.props.value).toBe('');
    expect(onComplete).not.toHaveBeenCalled();
  });

  test('exact case-sensitive answer advances to Question 2', () => {
    const onComplete = jest.fn();
    let renderer;
    act(() => {
      renderer = create(<AlarmQnaScreen onComplete={onComplete} />);
    });

    const input = renderer.root.findByProps({testID: 'qna-text-input'});

    // Type incorrect case: "earth" -> should NOT advance
    act(() => {
      input.props.onChangeText('earth');
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Still on question 1
    let questionText = renderer.root.findByProps({testID: 'qna-question-text'});
    expect(questionText.props.children).toBe('What planet do we live on?');

    // Type exact case: "Earth"
    act(() => {
      input.props.onChangeText('Earth');
    });

    // Advance past transition timer
    act(() => {
      jest.advanceTimersByTime(400);
    });

    // Now on Question 2!
    questionText = renderer.root.findByProps({testID: 'qna-question-text'});
    expect(questionText.props.children).toBe('How many days are there in a week?');
    expect(onComplete).not.toHaveBeenCalled();
  });

  test('completing all 5 questions calls onComplete', () => {
    const onComplete = jest.fn();
    let renderer;
    act(() => {
      renderer = create(<AlarmQnaScreen onComplete={onComplete} />);
    });

    const answers = ['Earth', 'Seven', 'Hot', 'Blue', 'Ten'];

    answers.forEach((ans, index) => {
      const input = renderer.root.findByProps({testID: 'qna-text-input'});
      act(() => {
        input.props.onChangeText(ans);
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

    // Enter correct answer then immediate repeated onChangeText calls
    act(() => {
      input.props.onChangeText('Earth');
      input.props.onChangeText('Earth');
      input.props.onChangeText('Earth');
    });

    act(() => {
      jest.advanceTimersByTime(400);
    });

    // Should only have advanced to question 2 (index 1), not skipped to question 3 or 4
    const questionText = renderer.root.findByProps({testID: 'qna-question-text'});
    expect(questionText.props.children).toBe('How many days are there in a week?');
  });
});
