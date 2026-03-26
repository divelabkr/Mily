// ParentOnboardingScreen.tsx — 부모 전용 3분 안내
// "이 앱을 통제도구로 쓰지 않는 법"
// 3단계: 철학이해 → 역할설정 → 시작
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { theme } from '../../ui/theme';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { MilyButton } from '../../components/ui/MilyButton';

interface ParentOnboardingScreenProps {
  onComplete: () => void;
}

const STEPS = [
  {
    emoji: '🤝',
    title: '판단하지 않아요',
    desc: 'Mily는 자녀를 평가하거나 점수 매기지 않아요.\n돈에 관한 대화를 자연스럽게 시작하는 도구예요.',
    points: [
      '소비 감시 앱이 아니에요',
      '자녀가 공개할 정보를 스스로 선택해요',
      '"잘못됐어요"라는 말은 앱에서 나오지 않아요',
    ],
  },
  {
    emoji: '🎯',
    title: '코치이지, 감독관이 아니에요',
    desc: '부모님은 자녀의 요청에 응답하고\n함께 계획을 만드는 역할이에요.',
    points: [
      '요청 카드에 3버튼으로 응답해요',
      '자녀 상세 내역은 기본으로 안 보여요',
      '칭찬 카드를 먼저 보내볼까요?',
    ],
  },
  {
    emoji: '🔐',
    title: '자녀가 공개 범위를 결정해요',
    desc: '역전된 프라이버시: 자녀가 부모에게\n보여줄 정보를 선택해요. 기본은 전부 비공개.',
    points: [
      '자녀 탭에서 공개 범위 설정 가능',
      '강제로 볼 수 있는 정보는 없어요',
      '신뢰가 쌓이면 자녀가 먼저 공유해요',
    ],
  },
];

export function ParentOnboardingScreen({ onComplete }: ParentOnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <StepIndicator totalSteps={STEPS.length} currentStep={step} />
        <Text style={styles.emoji}>{current.emoji}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.desc}>{current.desc}</Text>
        <View style={styles.pointsBox}>
          {current.points.map((p, i) => (
            <View key={i} style={styles.pointRow}>
              <Text style={styles.pointDot}>•</Text>
              <Text style={styles.pointText}>{p}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <MilyButton
          label={isLast ? '시작할게요' : '다음'}
          onPress={() => isLast ? onComplete() : setStep(step + 1)}
        />
        {step > 0 && (
          <TouchableOpacity style={styles.backLink} onPress={() => setStep(step - 1)}>
            <Text style={styles.backText}>이전</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.milyColors.cream },
  content: { padding: 24, alignItems: 'center', paddingTop: 40 },
  emoji: { fontSize: 56, marginTop: 24, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: theme.milyColors.brownDark, textAlign: 'center', marginBottom: 12 },
  desc: { fontSize: 15, color: theme.milyColors.brownMid, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  pointsBox: { width: '100%', backgroundColor: theme.milyColors.surface2, borderRadius: theme.borderRadius.card, padding: 16, gap: 10 },
  pointRow: { flexDirection: 'row' },
  pointDot: { fontSize: 15, color: theme.milyColors.coral, marginRight: 8, lineHeight: 22 },
  pointText: { flex: 1, fontSize: 14, color: theme.milyColors.brownDark, lineHeight: 22 },
  footer: { padding: 24, gap: 8 },
  backLink: { alignItems: 'center', paddingVertical: 8 },
  backText: { fontSize: 14, color: theme.milyColors.brownMid },
});
