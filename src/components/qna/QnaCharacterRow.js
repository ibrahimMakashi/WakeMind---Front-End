import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTheme} from '../../theme/ThemeProvider';

export const QNA_CHAR_STATES = {
  NOT_TYPED: 'not_typed',
  CORRECT: 'correct',
  INCORRECT: 'incorrect',
};

export function QnaCharacterRow({
  expectedAnswer = '',
  typedValue = '',
  isSuccess = false,
}) {
  const {colors} = useTheme();

  const successColor = colors?.success || '#4CD964';
  const errorColor = colors?.error || colors?.danger || '#E06B7A';
  const placeholderColor = colors?.muted || '#687690';
  const accentColor = colors?.accent || '#FFB84D';

  const cells = useMemo(() => {
    const expectedChars = expectedAnswer ? expectedAnswer.split('') : [];
    const typedChars = typedValue ? typedValue.split('') : [];
    const totalLength = Math.max(expectedChars.length, typedChars.length);

    const result = [];
    for (let i = 0; i < totalLength; i += 1) {
      const expectedChar = expectedChars[i];
      const typedChar = typedChars[i];

      let state = QNA_CHAR_STATES.NOT_TYPED;
      let displayChar = expectedChar || '';

      if (typedChar !== undefined) {
        if (expectedChar !== undefined && typedChar === expectedChar) {
          state = QNA_CHAR_STATES.CORRECT;
          displayChar = expectedChar;
        } else {
          state = QNA_CHAR_STATES.INCORRECT;
          displayChar = typedChar;
        }
      } else {
        state = QNA_CHAR_STATES.NOT_TYPED;
        displayChar = expectedChar || '';
      }

      const isCurrentCursor = typedChars.length === i;
      const isSpace = expectedChar === ' ' || typedChar === ' ';

      result.push({
        index: i,
        displayChar,
        expectedChar,
        typedChar,
        state,
        isCurrentCursor,
        isSpace,
      });
    }

    return result;
  }, [expectedAnswer, typedValue]);

  const cellDimensions = useMemo(() => {
    const count = cells.length;
    if (count <= 5) {
      return {width: 48, minHeight: 62, fontSize: 30, letterSpacing: 0};
    }
    if (count <= 8) {
      return {width: 38, minHeight: 54, fontSize: 24, letterSpacing: 0};
    }
    return {width: 30, minHeight: 46, fontSize: 20, letterSpacing: 0};
  }, [cells.length]);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {cells.map(cell => {
          const {index, displayChar, state, isCurrentCursor, isSpace} = cell;

          let cellBorderColor = colors?.borderSubtle || '#243046';
          let cellBgColor = 'rgba(255, 255, 255, 0.04)';
          let charColor = placeholderColor;

          if (isSuccess || state === QNA_CHAR_STATES.CORRECT) {
            cellBorderColor = successColor;
            cellBgColor = 'rgba(76, 217, 100, 0.14)';
            charColor = successColor;
          } else if (state === QNA_CHAR_STATES.INCORRECT) {
            cellBorderColor = errorColor;
            cellBgColor = 'rgba(224, 107, 122, 0.16)';
            charColor = errorColor;
          } else if (isCurrentCursor) {
            cellBorderColor = accentColor;
            cellBgColor = 'rgba(255, 184, 77, 0.08)';
          }

          return (
            <View
              key={`qna-cell-${index}`}
              accessibilityLabel={`Character ${index + 1}: ${displayChar || 'empty'}, ${state}`}
              style={[
                styles.cell,
                {
                  width: cellDimensions.width,
                  minHeight: cellDimensions.minHeight,
                  borderColor: cellBorderColor,
                  backgroundColor: cellBgColor,
                },
              ]}
              testID={`qna-cell-${index}`}>
              <Text
                style={[
                  styles.charText,
                  {
                    color: charColor,
                    fontSize: cellDimensions.fontSize,
                    opacity: state === QNA_CHAR_STATES.NOT_TYPED ? 0.6 : 1,
                    fontWeight: state === QNA_CHAR_STATES.NOT_TYPED ? '600' : '700',
                  },
                ]}
                testID={`qna-char-${index}`}>
                {isSpace ? '·' : displayChar}
              </Text>

              {isCurrentCursor && !isSuccess && (
                <View
                  style={[styles.cursorIndicator, {backgroundColor: accentColor}]}
                  testID="qna-cursor-indicator"
                />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    width: '100%',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  cell: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  charText: {
    textAlign: 'center',
  },
  cursorIndicator: {
    bottom: 0,
    height: 3,
    left: 4,
    position: 'absolute',
    right: 4,
    borderRadius: 1.5,
  },
});
