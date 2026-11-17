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

describe('QnaSentenceField Component with Moving Next-Character Box', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('initial state: box starts at index 0 containing first expected character W', () => {
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

    // The current box is present and contains 'W'
    const currentBox = renderer.root.findByProps({testID: 'qna-current-character'});
    expect(currentBox.props.children).toBe('W');

    // There should be NO literal '|' cursor
    const cursor = renderer.root.findAllByProps({testID: 'qna-cursor'});
    expect(cursor).toHaveLength(0);

    // Remaining characters (e.g. '.' at end) are muted gray
    const charLast = renderer.root.findByProps({testID: 'qna-char-23'});
    expect(charLast.props.children).toBe('.');
    expect(charLast.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({color: '#687690', opacity: 0.65}),
      ]),
    );
  });

  test('moves to next expected character as user types correctly', () => {
    let renderer;
    const expected = 'We live on planet Earth.';

    act(() => {
      renderer = create(
        <QnaSentenceField expectedAnswer={expected} typedValue="" />,
      );
    });

    // 1. Initial: box has 'W'
    expect(
      renderer.root.findByProps({testID: 'qna-current-character'}).props.children,
    ).toBe('W');

    // 2. Typed 'W' -> box moves to 'e'
    act(() => {
      renderer.update(
        <QnaSentenceField expectedAnswer={expected} typedValue="W" />,
      );
    });
    expect(
      renderer.root.findByProps({testID: 'qna-current-character'}).props.children,
    ).toBe('e');
    // 'W' at index 0 is now green
    expect(renderer.root.findByProps({testID: 'qna-char-0'}).props.children).toBe('W');
    expect(renderer.root.findByProps({testID: 'qna-char-0'}).props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({color: '#4CD964'})]),
    );

    // 3. Typed 'We' -> box moves to space (visually blank space ' ')
    act(() => {
      renderer.update(
        <QnaSentenceField expectedAnswer={expected} typedValue="We" />,
      );
    });
    const spaceBox = renderer.root.findByProps({testID: 'qna-current-character'});
    expect(spaceBox.props.children).toBe(' ');
    expect(spaceBox.props.children).not.toContain('·');
    expect(spaceBox.props.children).not.toContain('.');
    expect(spaceBox.props.children).not.toContain('•');
    expect(spaceBox.props.children).not.toContain('_');

    // 4. Typed 'We ' -> box moves to 'l'
    act(() => {
      renderer.update(
        <QnaSentenceField expectedAnswer={expected} typedValue="We " />,
      );
    });
    expect(
      renderer.root.findByProps({testID: 'qna-current-character'}).props.children,
    ).toBe('l');

    // 5. Mid sentence: Typed 'We liv' -> box moves to 'e'
    act(() => {
      renderer.update(
        <QnaSentenceField expectedAnswer={expected} typedValue="We liv" />,
      );
    });
    expect(
      renderer.root.findByProps({testID: 'qna-current-character'}).props.children,
    ).toBe('e');

    // 6. Before punctuation: Typed 'We live on planet Earth' -> box moves to '.'
    act(() => {
      renderer.update(
        <QnaSentenceField
          expectedAnswer={expected}
          typedValue="We live on planet Earth"
        />,
      );
    });
    expect(
      renderer.root.findByProps({testID: 'qna-current-character'}).props.children,
    ).toBe('.');

    // 7. Completed answer: Typed full sentence with isSuccess=true -> box disappears
    act(() => {
      renderer.update(
        <QnaSentenceField
          expectedAnswer={expected}
          isSuccess={true}
          typedValue={expected}
        />,
      );
    });
    const remainingBoxes = renderer.root.findAllByProps({
      testID: 'qna-current-character',
    });
    expect(remainingBoxes).toHaveLength(0);
  });

  test('incorrect character displays in red and backspace restores expected character box', () => {
    let renderer;
    const expected = 'We live on planet Earth.';

    act(() => {
      renderer = create(
        <QnaSentenceField expectedAnswer={expected} typedValue="We l" />,
      );
    });

    // Before error: box displays 'i'
    expect(
      renderer.root.findByProps({testID: 'qna-current-character'}).props.children,
    ).toBe('i');

    // User types 'x' instead of 'i'
    act(() => {
      renderer.update(
        <QnaSentenceField expectedAnswer={expected} typedValue="We lx" />,
      );
    });

    // The wrong character 'x' is rendered in red at index 4
    const wrongChar = renderer.root.findByProps({testID: 'qna-char-4'});
    expect(wrongChar.props.children).toBe('x');
    expect(wrongChar.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          color: '#E06B7A',
          backgroundColor: 'rgba(224, 107, 122, 0.24)',
        }),
      ]),
    );

    // Box does NOT advance to 'v'; normal box is hidden while error is active
    expect(
      renderer.root.findAllByProps({testID: 'qna-current-character'}),
    ).toHaveLength(0);

    // User presses Backspace -> removes 'x'
    act(() => {
      renderer.update(
        <QnaSentenceField expectedAnswer={expected} typedValue="We l" />,
      );
    });

    // Expected 'i' box is restored!
    expect(
      renderer.root.findByProps({testID: 'qna-current-character'}).props.children,
    ).toBe('i');
  });

  test('case sensitivity: lowercase w against uppercase W displays as red error', () => {
    let renderer;
    act(() => {
      renderer = create(
        <QnaSentenceField
          expectedAnswer="We live on planet Earth."
          typedValue="we"
        />,
      );
    });

    // First character was expected 'W', typed 'w' -> displayed in red
    const wrongW = renderer.root.findByProps({testID: 'qna-char-0'});
    expect(wrongW.props.children).toBe('w');
    expect(wrongW.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({color: '#E06B7A'}),
      ]),
    );
  });

  test('space guidance: visually indicates space with blank box (no dot) and requires real space character', () => {
    let renderer;
    act(() => {
      renderer = create(
        <QnaSentenceField
          expectedAnswer="We live on planet Earth."
          typedValue="We"
        />,
      );
    });

    // Current box shows blank space (no dot, no bullet, no underscore)
    const spaceBox = renderer.root.findByProps({testID: 'qna-current-character'});
    expect(spaceBox.props.children).toBe(' ');
    expect(spaceBox.props.children).not.toContain('·');
    expect(spaceBox.props.children).not.toContain('.');
    expect(spaceBox.props.children).not.toContain('•');
    expect(spaceBox.props.children).not.toContain('_');

    // Now type an actual space ' '
    act(() => {
      renderer.update(
        <QnaSentenceField
          expectedAnswer="We live on planet Earth."
          typedValue="We "
        />,
      );
    });

    // Space character at index 2 is now correctly typed (green)
    const spaceChar = renderer.root.findByProps({testID: 'qna-char-2'});
    expect(spaceChar.props.children).toBe(' ');
    expect(spaceChar.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({color: '#4CD964'}),
      ]),
    );

    // Next box moved to 'l'
    expect(
      renderer.root.findByProps({testID: 'qna-current-character'}).props.children,
    ).toBe('l');
  });

  test('no literal cursor | exists anywhere in output', () => {
    let renderer;
    act(() => {
      renderer = create(
        <QnaSentenceField
          expectedAnswer="We live on planet Earth."
          typedValue="We live"
        />,
      );
    });

    const cursors = renderer.root.findAllByProps({testID: 'qna-cursor'});
    expect(cursors).toHaveLength(0);
  });
});
