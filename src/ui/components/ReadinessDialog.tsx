import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { theme } from '../theme';
import {
  ReadinessDialog as ReadinessDialogType,
  ReadinessQuestion,
} from '../../engines/unlock/unlockTypes';
import { evaluateReadiness, ReadinessResult } from '../../engines/unlock/unlockService';

// ──────────────────────────────────────────────
// 미리 써보기 대화 모달
// CLAUDE.md §19: 3택 3문항, 2/3 맞추면 해금
// 실패 기록 없음. 부모에게 실패 안 보임.
// ──────────────────────────────────────────────

interface Props {
  visible: boolean;
  dialog: ReadinessDialogType;
  onPass: () => void;   // 통과 → 조기 해금 처리
  onClose: () => void;  // 닫기 (실패/취소 모두 동일 — 실패 기록 없음)
}

type Phase = 'quiz' | 'result_pass';
// 실패 결과는 별도 상태 없음: 그냥 닫히고 재시도 가능

export function ReadinessDialog({ visible, dialog, onPass, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('quiz');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(0 | 1 | 2 | null)[]>([null, null, null]);
  const [selectedOption, setSelectedOption] = useState<0 | 1 | 2 | null>(null);

  const question: ReadinessQuestion = dialog.questions[currentQ];
  const isLastQuestion = currentQ === dialog.questions.length - 1;

  function handleSelectOption(index: 0 | 1 | 2) {
    setSelectedOption(index);
  }

  function handleNext() {
    if (selectedOption === null) return;

    const newAnswers = [...answers] as (0 | 1 | 2 | null)[];
    newAnswers[currentQ] = selectedOption;
    setAnswers(newAnswers);

    if (!isLastQuestion) {
      setCurrentQ((q) => q + 1);
      setSelectedOption(null);
      return;
    }

    // 마지막 문항 — 결과 평가
    const finalAnswers = newAnswers as (0 | 1 | 2)[];
    const result: ReadinessResult = evaluateReadiness(dialog, finalAnswers);

    if (result.passed) {
      setPhase('result_pass');
    } else {
      // 실패: 기록 없이 조용히 닫음 (CLAUDE.md §19)
      resetAndClose();
    }
  }

  function resetAndClose() {
    setPhase('quiz');
    setCurrentQ(0);
    setAnswers([null, null, null]);
    setSelectedOption(null);
    onClose();
  }

  function handlePassConfirm() {
    resetState();
    onPass();
  }

  function resetState() {
    setPhase('quiz');
    setCurrentQ(0);
    setAnswers([null, null, null]);
    setSelectedOption(null);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={resetAndClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>

          {phase === 'quiz' && (
            <>
              {/* 진행 도트 */}
              <View style={styles.dots}>
                {dialog.questions.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === currentQ && styles.dotActive,
                      i < currentQ && styles.dotDone,
                    ]}
                  />
                ))}
              </View>

              <Text style={styles.dialogTitle}>미리 써보기 대화</Text>
              <Text style={styles.subtitle}>
                {currentQ + 1} / {dialog.questions.length}
              </Text>

              <Text style={styles.questionText}>{question.text}</Text>

              <View style={styles.options}>
                {question.options.map((opt, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.option,
                      selectedOption === i && styles.optionSelected,
                    ]}
                    onPress={() => handleSelectOption(i as 0 | 1 | 2)}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.optionBullet,
                      selectedOption === i && styles.optionBulletSelected,
                    ]}>
                      <Text style={[
                        styles.optionBulletText,
                        selectedOption === i && styles.optionBulletTextSelected,
                      ]}>
                        {['①', '②', '③'][i]}
                      </Text>
                    </View>
                    <Text style={[
                      styles.optionText,
                      selectedOption === i && styles.optionTextSelected,
                    ]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.nextBtn, selectedOption === null && styles.nextBtnDisabled]}
                onPress={handleNext}
                disabled={selectedOption === null}
              >
                <Text style={styles.nextBtnText}>
                  {isLastQuestion ? '완료' : '다음 →'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={resetAndClose}>
                <Text style={styles.cancelBtnText}>나중에 할게요</Text>
              </TouchableOpacity>
            </>
          )}

          {phase === 'result_pass' && (
            <View style={styles.passContainer}>
              <Text style={styles.passEmoji}>🎉</Text>
              <Text style={styles.passTitle}>준비됐어요!</Text>
              <Text style={styles.passBody}>
                개념을 잘 이해했어요. 새 기능이 열릴 거예요.
              </Text>
              <Text style={styles.passNote}>
                부모님께도 알려드릴게요 😊
              </Text>
              <TouchableOpacity
                style={styles.nextBtn}
                onPress={handlePassConfirm}
              >
                <Text style={styles.nextBtnText}>기능 열기</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
    width: 20,
  },
  dotDone: {
    backgroundColor: theme.colors.success,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    lineHeight: 22,
    marginBottom: 16,
  },
  options: {
    gap: 10,
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: theme.borderRadius.button,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    gap: 10,
    backgroundColor: theme.colors.surface,
  },
  optionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#EEF4FF',
  },
  optionBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionBulletSelected: {
    backgroundColor: theme.colors.primary,
  },
  optionBulletText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  optionBulletTextSelected: {
    color: '#FFF',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 20,
    paddingTop: 4,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
  nextBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.button,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  nextBtnDisabled: {
    backgroundColor: theme.colors.border,
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelBtnText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  // 통과 화면
  passContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  passEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  passTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  passBody: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 6,
  },
  passNote: {
    fontSize: 13,
    color: theme.colors.primary,
    marginBottom: 24,
  },
});
