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
    const totalLength = Math.max(expectedChars.length, typedChars.length);

    const nodes = [];
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

      const isCursor = i === typedChars.length && !isSuccess;

      nodes.push({
        index: i,
        state,
        displayChar,
        isCursor,
      });
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
              <React.Fragment key={`char-${node.index}`}>
                {node.isCursor && (
                  <Text
                    style={[styles.cursor, {color: accentColor}]}
                    testID="qna-cursor">
                    |
                  </Text>
                )}
                <Text
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
              </React.Fragment>
            );
          })}
          {typedValue.length >= characterNodes.length && !isSuccess && (
            <Text
              style={[styles.cursor, {color: accentColor}]}
              testID="qna-cursor">
              |
            </Text>
          )}
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
  cursor: {
    fontSize: 22,
    fontWeight: '900',
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
