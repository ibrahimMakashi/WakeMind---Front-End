import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useTheme} from '../../theme/ThemeProvider';

export const QNA_CHAR_STATES = {
  NOT_TYPED: 'not_typed',
  CORRECT: 'correct',
  INCORRECT: 'incorrect',
};

export function QnaSentenceField({
  expectedAnswer = '',
  typedValue = '',
  onChangeText,
  isSuccess = false,
  testID = 'qna-typing-field',
}) {
  const {colors} = useTheme();
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(true);

  const successColor = colors?.success || '#4CD964';
  const errorColor = colors?.error || colors?.danger || '#E06B7A';
  const placeholderColor = colors?.muted || '#687690';
  const accentColor = colors?.accent || '#FFB84D';

  // Automatically focus on mount or when expectedAnswer changes
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [expectedAnswer]);

  const characterNodes = useMemo(() => {
    const expectedChars = expectedAnswer ? expectedAnswer.split('') : [];
    const typedChars = typedValue ? typedValue.split('') : [];

    // Find the first index where typed characters deviate from expected
    let firstMismatchIndex = -1;
    for (let i = 0; i < typedChars.length; i += 1) {
      if (i >= expectedChars.length || typedChars[i] !== expectedChars[i]) {
        firstMismatchIndex = i;
        break;
      }
    }

    const hasError = firstMismatchIndex !== -1;
    // Current next-character box is displayed at typedChars.length if no error and not finished
    const currentBoxIndex =
      !hasError && !isSuccess && typedChars.length < expectedChars.length
        ? typedChars.length
        : -1;

    const nodes = [];

    if (hasError) {
      // 1. Correct characters before the error
      for (let i = 0; i < firstMismatchIndex; i += 1) {
        nodes.push({
          index: i,
          state: QNA_CHAR_STATES.CORRECT,
          displayChar: expectedChars[i],
          isCurrentBox: false,
        });
      }

      // 2. Incorrect typed characters starting at firstMismatchIndex
      for (let i = firstMismatchIndex; i < typedChars.length; i += 1) {
        nodes.push({
          index: i,
          state: QNA_CHAR_STATES.INCORRECT,
          displayChar: typedChars[i],
          isCurrentBox: false,
        });
      }

      // 3. Remaining expected characters in muted gray
      for (let i = typedChars.length; i < expectedChars.length; i += 1) {
        nodes.push({
          index: i,
          state: QNA_CHAR_STATES.NOT_TYPED,
          displayChar: expectedChars[i],
          isCurrentBox: false,
        });
      }
    } else {
      // No error
      // 1. Characters typed correctly so far
      for (let i = 0; i < typedChars.length; i += 1) {
        nodes.push({
          index: i,
          state: QNA_CHAR_STATES.CORRECT,
          displayChar: expectedChars[i],
          isCurrentBox: false,
        });
      }

      // 2. Next expected character inside the highlighted box
      if (currentBoxIndex !== -1) {
        nodes.push({
          index: currentBoxIndex,
          state: QNA_CHAR_STATES.NOT_TYPED,
          displayChar: expectedChars[currentBoxIndex],
          isCurrentBox: true,
        });
      }

      // 3. Remaining untyped characters after the box
      const remainderStart =
        currentBoxIndex !== -1 ? currentBoxIndex + 1 : typedChars.length;
      for (let i = remainderStart; i < expectedChars.length; i += 1) {
        nodes.push({
          index: i,
          state: QNA_CHAR_STATES.NOT_TYPED,
          displayChar: expectedChars[i],
          isCurrentBox: false,
        });
      }
    }

    return nodes;
  }, [expectedAnswer, isSuccess, typedValue]);

  const handleCardPress = () => {
    inputRef.current?.focus();
  };

  let fieldBorderColor = colors?.borderSubtle || '#243046';
  if (isSuccess) {
    fieldBorderColor = successColor;
  } else if (isFocused) {
    fieldBorderColor = accentColor;
  }

  return (
    <Pressable
      accessible={false}
      onPress={handleCardPress}
      style={[
        styles.fieldContainer,
        {
          backgroundColor: colors?.surfaceRaised || '#121927',
          borderColor: fieldBorderColor,
        },
      ]}>
      {/* Visual continuous sentence text */}
      <View style={styles.sentenceWrapper}>
        <Text style={styles.sentenceParagraph} testID={testID}>
          {characterNodes.map(node => {
            if (node.isCurrentBox) {
              const boxChar =
                node.displayChar === ' ' ? ' ' : node.displayChar;
              return (
                <Text
                  key={`char-${node.index}`}
                  accessibilityLabel={
                    node.displayChar === ' '
                      ? 'Next character: space'
                      : `Next character: ${node.displayChar}`
                  }
                  style={[
                    styles.charText,
                    styles.currentBoxText,
                    {
                      color: accentColor,
                      borderColor: accentColor,
                    },
                  ]}
                  testID="qna-current-character">
                  {boxChar}
                </Text>
              );
            }

            let charColor = placeholderColor;
            let charBg = 'transparent';
            let fontWeight = '500';
            let opacity = 0.65;

            if (isSuccess || node.state === QNA_CHAR_STATES.CORRECT) {
              charColor = successColor;
              fontWeight = '700';
              opacity = 1;
            } else if (node.state === QNA_CHAR_STATES.INCORRECT) {
              charColor = errorColor;
              charBg = 'rgba(224, 107, 122, 0.24)';
              fontWeight = '700';
              opacity = 1;
            }

            const renderChar =
              node.state === QNA_CHAR_STATES.INCORRECT && node.displayChar === ' '
                ? '␣'
                : node.displayChar;

            return (
              <Text
                key={`char-${node.index}`}
                style={[
                  styles.charText,
                  {
                    color: charColor,
                    backgroundColor: charBg,
                    fontWeight,
                    opacity,
                  },
                ]}
                testID={`qna-char-${node.index}`}>
                {renderChar}
              </Text>
            );
          })}
        </Text>
      </View>

      {/* Real editable TextInput covering the field for full touch & keyboard support */}
      <TextInput
        ref={inputRef}
        accessibilityHint="Type the complete sentence character by character"
        accessibilityLabel="Sentence typing input"
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect={false}
        autoFocus={true}
        caretHidden={true}
        clearButtonMode="never"
        contextMenuHidden={true}
        disableFullscreenUI={true}
        keyboardType="default"
        maxLength={expectedAnswer.length + 8}
        multiline={true}
        onBlur={() => setIsFocused(false)}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        returnKeyType="done"
        spellCheck={false}
        style={styles.hiddenInput}
        testID="qna-text-input"
        value={typedValue}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fieldContainer: {
    borderRadius: 20,
    borderWidth: 1.5,
    minHeight: 140,
    paddingHorizontal: 20,
    paddingVertical: 18,
    position: 'relative',
    width: '100%',
  },
  sentenceWrapper: {
    width: '100%',
  },
  sentenceParagraph: {
    fontSize: 22,
    letterSpacing: 0.3,
    lineHeight: 34,
  },
  charText: {
    borderRadius: 3,
  },
  currentBoxText: {
    backgroundColor: 'rgba(255, 184, 77, 0.22)',
    borderRadius: 4,
    borderWidth: 1.5,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 34,
  },
  hiddenInput: {
    bottom: 0,
    color: 'transparent',
    left: 0,
    opacity: 0.01,
    paddingHorizontal: 20,
    paddingVertical: 18,
    position: 'absolute',
    right: 0,
    textAlignVertical: 'top',
    top: 0,
  },
});
