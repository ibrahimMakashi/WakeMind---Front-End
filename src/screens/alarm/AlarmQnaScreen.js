import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppIcon} from '../../components/AppIcon';
import {QnaCharacterRow} from '../../components/qna/QnaCharacterRow';
import {DEFAULT_QNA_QUESTIONS} from '../../data/qnaQuestions';
import {useTheme} from '../../theme/ThemeProvider';

const SUCCESS_TRANSITION_MS = 380;

export function AlarmQnaScreen({
  questions = DEFAULT_QNA_QUESTIONS,
  onComplete,
  alarmId = '',
  occurrenceId = '',
  label = 'Alarm',
  triggerAtMillis = Date.now(),
}) {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [typedValue, setTypedValue] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const isAdvancingRef = useRef(false);
  const inputRef = useRef(null);
  const advanceTimerRef = useRef(null);

  const safeQuestions = useMemo(() => {
    if (Array.isArray(questions) && questions.length > 0) {
      return questions;
    }
    return DEFAULT_QNA_QUESTIONS;
  }, [questions]);

  const currentQuestion = useMemo(() => {
    return safeQuestions[currentQuestionIndex] || safeQuestions[0];
  }, [currentQuestionIndex, safeQuestions]);

  const expectedAnswer = currentQuestion?.answer || '';
  const totalQuestions = safeQuestions.length;

  // Auto-focus the input on mount and whenever the question changes
  useEffect(() => {
    isAdvancingRef.current = false;
    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 120);

    return () => {
      clearTimeout(focusTimer);
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
    };
  }, [currentQuestionIndex]);

  const handleBackPress = useCallback(() => {
    AccessibilityInfo.announceForAccessibility(
      'Alarm Q&A in progress. Answer all questions to dismiss alarm.',
    );
    try {
      Vibration.vibrate(60);
    } catch {}
  }, []);

  const handleTextChange = useCallback(
    text => {
      if (isAdvancingRef.current) {
        return;
      }
      setTypedValue(text);

      // Exact case-sensitive match
      if (text === expectedAnswer) {
        isAdvancingRef.current = true;
        setIsSuccess(true);
        try {
          Vibration.vibrate(50);
        } catch {}

        advanceTimerRef.current = setTimeout(() => {
          setIsSuccess(false);

          if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setTypedValue('');
            isAdvancingRef.current = false;
            inputRef.current?.focus();
          } else {
            // All questions completed!
            isAdvancingRef.current = false;
            if (typeof onComplete === 'function') {
              onComplete();
            }
          }
        }, SUCCESS_TRANSITION_MS);
      }
    },
    [currentQuestionIndex, expectedAnswer, onComplete, totalQuestions],
  );

  const progressPercent = Math.round(
    ((currentQuestionIndex + (isSuccess ? 1 : 0)) / totalQuestions) * 100,
  );

  return (
    <View style={[styles.screen, {backgroundColor: colors?.background || '#070C16'}]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}>
        <ScrollView
          bounces={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 16,
              paddingBottom: Math.max(insets.bottom, 20) + 16,
            },
          ]}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              accessibilityHint="Alarm Q&A cannot be dismissed with back button"
              accessibilityLabel="Back"
              accessibilityRole="button"
              hitSlop={12}
              onPress={handleBackPress}
              style={[styles.headerIconBtn, {borderColor: colors?.borderSubtle || '#243046'}]}>
              <AppIcon color={colors?.textSoft || '#E2E8F0'} name="chevron-left" size={22} />
            </Pressable>

            <View style={styles.headerTitleWrap}>
              <Text style={[styles.headerTitle, {color: colors?.text || '#FFFFFF'}]}>
                WAKE Q&A
              </Text>
            </View>

            <View
              style={[
                styles.profileAvatar,
                {
                  backgroundColor: colors?.accent || '#FFB84D',
                },
              ]}>
              <AppIcon color={colors?.accentText || '#070C16'} name="account" size={18} />
            </View>
          </View>

          {/* Ringing Protocol Pill */}
          <View style={styles.protocolRow}>
            <View
              style={[
                styles.protocolPill,
                {
                  backgroundColor: colors?.surfaceRaised || '#121927',
                  borderColor: colors?.borderSubtle || '#243046',
                },
              ]}>
              <View style={[styles.pulseDot, {backgroundColor: colors?.accent || '#FFB84D'}]} />
              <Text style={[styles.protocolText, {color: colors?.accent || '#FFB84D'}]}>
                Q&A PROTOCOL
              </Text>
              <Text style={[styles.protocolDivider, {color: colors?.muted || '#687690'}]}>|</Text>
              <AppIcon color={colors?.textSoft || '#E2E8F0'} name="volume-high" size={14} />
              <Text style={[styles.protocolVolume, {color: colors?.textSoft || '#E2E8F0'}]}>
                100%
              </Text>
            </View>
          </View>

          {/* Question Step & Progress Indicator */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={[styles.progressStepText, {color: colors?.accent || '#FFB84D'}]}>
                QUESTION {currentQuestionIndex + 1} OF {totalQuestions}
              </Text>
              <Text style={[styles.progressPercentText, {color: colors?.textSubtle || '#94A3B8'}]}>
                {progressPercent}%
              </Text>
            </View>

            {/* 5 Segmented Progress Bars */}
            <View style={styles.stepBarsRow}>
              {safeQuestions.map((q, idx) => {
                const isCompleted = idx < currentQuestionIndex || (idx === currentQuestionIndex && isSuccess);
                const isActive = idx === currentQuestionIndex && !isSuccess;

                let barBg = colors?.line || '#1E293B';
                if (isCompleted) {
                  barBg = colors?.success || '#4CD964';
                } else if (isActive) {
                  barBg = colors?.accent || '#FFB84D';
                }

                return (
                  <View
                    key={`qna-bar-${q.id || idx}`}
                    style={[
                      styles.stepBar,
                      {
                        backgroundColor: barBg,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>

          {/* Question Card */}
          <View
            style={[
              styles.questionCard,
              {
                backgroundColor: colors?.surface || '#0E1420',
                borderColor: colors?.cardBorder || '#1E293B',
              },
            ]}>
            <View style={styles.questionCardTop}>
              <View
                style={[
                  styles.badgePill,
                  {
                    backgroundColor: 'rgba(255, 184, 77, 0.12)',
                    borderColor: 'rgba(255, 184, 77, 0.35)',
                  },
                ]}>
                <AppIcon color={colors?.accent || '#FFB84D'} name="brain" size={12} />
                <Text style={[styles.badgeText, {color: colors?.accent || '#FFB84D'}]}>
                  MIND MATRIX
                </Text>
              </View>

              <Text style={[styles.questionIndexMeta, {color: colors?.muted || '#687690'}]}>
                0{currentQuestionIndex + 1} / 0{totalQuestions}
              </Text>
            </View>

            <Text
              style={[styles.questionTitle, {color: colors?.text || '#FFFFFF'}]}
              testID="qna-question-text">
              {currentQuestion?.question}
            </Text>
          </View>

          {/* Typing Area (TypeMaster style) */}
          <View
            style={[
              styles.typingCard,
              {
                backgroundColor: colors?.surfaceRaised || '#121927',
                borderColor: isSuccess ? colors?.success || '#4CD964' : colors?.borderSubtle || '#243046',
              },
            ]}>
            <View style={styles.typingHeader}>
              <Text style={[styles.typingHintText, {color: colors?.textSubtle || '#94A3B8'}]}>
                {isSuccess ? '✓ EXACT MATCH' : 'TYPE THE ANSWER EXACTLY'}
              </Text>
            </View>

            {/* Answer character row & invisible overlay TextInput */}
            <Pressable
              accessible={false}
              onPress={() => inputRef.current?.focus()}
              style={styles.inputHitArea}>
              <QnaCharacterRow
                expectedAnswer={expectedAnswer}
                isSuccess={isSuccess}
                typedValue={typedValue}
              />

              <TextInput
                ref={inputRef}
                accessibilityHint="Type the exact answer character by character"
                accessibilityLabel="Answer input"
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect={false}
                autoFocus={true}
                caretHidden={true}
                clearButtonMode="never"
                contextMenuHidden={true}
                disableFullscreenUI={true}
                keyboardType="default"
                maxLength={expectedAnswer.length + 4}
                onChangeText={handleTextChange}
                returnKeyType="done"
                spellCheck={false}
                style={styles.hiddenInput}
                testID="qna-text-input"
                value={typedValue}
              />
            </Pressable>

            <View style={styles.typingFooter}>
              <AppIcon color={colors?.muted || '#687690'} name="information-outline" size={13} />
              <Text style={[styles.typingRuleText, {color: colors?.muted || '#687690'}]}>
                Case-sensitive • Character-for-character
              </Text>
            </View>
          </View>

          {/* Vision Lock Badge */}
          <View
            style={[
              styles.visionLockBanner,
              {
                backgroundColor: colors?.surface || '#0E1420',
                borderColor: colors?.borderSubtle || '#243046',
              },
            ]}>
            <View
              style={[
                styles.lockIconBox,
                {
                  backgroundColor: 'rgba(255, 184, 77, 0.1)',
                  borderColor: 'rgba(255, 184, 77, 0.25)',
                },
              ]}>
              <AppIcon color={colors?.accent || '#FFB84D'} name="lock-outline" size={18} />
            </View>
            <View style={styles.visionLockInfo}>
              <Text style={[styles.visionLockTitle, {color: colors?.text || '#FFFFFF'}]}>
                VISION LOCK ACTIVE
              </Text>
              <Text style={[styles.visionLockSubtitle, {color: colors?.muted || '#687690'}]}>
                Complete all 5 questions to disarm acoustic protocol.
              </Text>
            </View>
          </View>

          {/* Motivational Quote */}
          <View style={styles.footerQuoteWrap}>
            <Text style={[styles.footerQuote, {color: colors?.muted || '#687690'}]}>
              Precision awakens the mind. Your future self is built now.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerIconBtn: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerTitleWrap: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  profileAvatar: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  protocolRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  protocolPill: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pulseDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  protocolText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  protocolDivider: {
    fontSize: 11,
  },
  protocolVolume: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressStepText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepBarsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBar: {
    borderRadius: 2,
    flex: 1,
    height: 4,
  },
  questionCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    padding: 20,
  },
  questionCardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgePill: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  questionIndexMeta: {
    fontSize: 12,
    fontWeight: '700',
  },
  questionTitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
  },
  typingCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 18,
    paddingHorizontal: 16,
    paddingVertical: 18,
    position: 'relative',
  },
  typingHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  typingHintText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  inputHitArea: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  hiddenInput: {
    bottom: 0,
    color: 'transparent',
    left: 0,
    opacity: 0.01,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  typingFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 10,
  },
  typingRuleText: {
    fontSize: 11,
    fontWeight: '500',
  },
  visionLockBanner: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
    padding: 16,
  },
  lockIconBox: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  visionLockInfo: {
    flex: 1,
  },
  visionLockTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  visionLockSubtitle: {
    fontSize: 11,
    lineHeight: 16,
  },
  footerQuoteWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerQuote: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});
