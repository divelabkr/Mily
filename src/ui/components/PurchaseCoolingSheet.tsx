// ──────────────────────────────────────────────
// PurchaseCoolingSheet.tsx — 구매 전 냉각 장치 UI
// 3문항 질문형. 강요 금지. "그냥 보내기" 옵션 유지.
// 판단/점수화/훈계 표현 절대 금지.
// ──────────────────────────────────────────────

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { theme } from '../theme';
import {
  CoolingAnswers,
  COOLING_QUESTIONS,
  createDefaultCoolingAnswers,
} from '../../engines/requestCard/coolingService';

interface PurchaseCoolingSheetProps {
  visible: boolean;
  onComplete: (answers: CoolingAnswers) => void; // 3문항 완료 후
  onSkip: () => void;                            // "그냥 보내기"
  onClose: () => void;
}

export function PurchaseCoolingSheet({
  visible,
  onComplete,
  onSkip,
  onClose,
}: PurchaseCoolingSheetProps) {
  const [step, setStep] = useState(0); // 0=intro, 1~3=questions
  const [answers, setAnswers] = useState<CoolingAnswers>(
    createDefaultCoolingAnswers()
  );

  const handleReset = () => {
    setStep(0);
    setAnswers(createDefaultCoolingAnswers());
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSkip = () => {
    handleReset();
    onSkip();
  };

  const handleNextStep = () => {
    if (step < COOLING_QUESTIONS.length) {
      setStep(step + 1);
    } else {
      handleReset();
      onComplete(answers);
    }
  };

  const currentQ = step > 0 ? COOLING_QUESTIONS[step - 1] : null;
  const isLastStep = step === COOLING_QUESTIONS.length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {step === 0 && (
              /* 인트로 화면 */
              <View style={styles.introSection}>
                <Text style={styles.introEmoji}>🛒</Text>
                <Text style={styles.introTitle}>
                  구매 전 잠깐 생각해볼까요?
                </Text>
                <Text style={styles.introSub}>
                  3가지 질문에 대답해보면{'\n'}
                  더 명확해질 수 있어요.
                </Text>
                <Text style={styles.introHint}>
                  강요가 아니에요. 그냥 보내도 괜찮아요.
                </Text>
              </View>
            )}

            {step > 0 && currentQ && (
              /* 질문 화면 */
              <View style={styles.questionSection}>
                <Text style={styles.stepLabel}>
                  {step} / {COOLING_QUESTIONS.length}
                </Text>
                <Text style={styles.questionText}>{currentQ.question}</Text>

                {currentQ.type === 'text' && (
                  <TextInput
                    style={styles.textInput}
                    placeholder={currentQ.placeholder}
                    placeholderTextColor={theme.colors.textSecondary}
                    value={
                      currentQ.id === 'whyNeeded'
                        ? answers.whyNeeded
                        : answers.alternatives
                    }
                    onChangeText={(v) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [currentQ.id]: v,
                      }))
                    }
                    multiline
                    autoFocus
                  />
                )}

                {currentQ.type === 'choice' && (
                  <View style={styles.choiceRow}>
                    {currentQ.options.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.choiceBtn,
                          answers.urgency === opt.value &&
                            styles.choiceBtnSelected,
                        ]}
                        onPress={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            urgency: opt.value as 'now' | 'later',
                          }))
                        }
                        accessibilityRole="button"
                        accessibilityState={{ selected: answers.urgency === opt.value }}
                      >
                        <Text
                          style={[
                            styles.choiceBtnText,
                            answers.urgency === opt.value &&
                              styles.choiceBtnTextSelected,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* 버튼 영역 */}
          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={step === 0 ? handleNextStep : handleNextStep}
              accessibilityRole="button"
            >
              <Text style={styles.nextBtnText}>
                {step === 0
                  ? '질문 시작하기'
                  : isLastStep
                  ? '요청 카드 작성하기'
                  : '다음'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleSkip}
              accessibilityRole="button"
            >
              <Text style={styles.skipBtnText}>그냥 보내기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: theme.spacing[6],
    paddingBottom: theme.spacing[8],
    minHeight: 360,
  },
  introSection: {
    alignItems: 'center',
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[5],
  },
  introEmoji: {
    fontSize: 40,
    marginBottom: theme.spacing[4],
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing[3],
  },
  introSub: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing[3],
  },
  introHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  questionSection: {
    paddingTop: theme.spacing[2],
    paddingBottom: theme.spacing[4],
  },
  stepLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing[3],
    textAlign: 'center',
  },
  questionText: {
    fontSize: 19,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing[5],
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing[3],
    fontSize: 14,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  choiceRow: {
    gap: theme.spacing[3],
  },
  choiceBtn: {
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.borderRadius.button,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    minHeight: 44,
  },
  choiceBtnSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#EDF2F9',
  },
  choiceBtnText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  choiceBtnTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  buttonSection: {
    gap: theme.spacing[3],
    marginTop: theme.spacing[5],
  },
  nextBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.button,
    paddingVertical: theme.spacing[4],
    alignItems: 'center',
    minHeight: 44,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: theme.spacing[3],
    minHeight: 44,
  },
  skipBtnText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});
