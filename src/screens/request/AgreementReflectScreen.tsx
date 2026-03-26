// AgreementReflectScreen.tsx — 합의 완료 후 회고 (6단계 마지막)
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { theme } from '../../ui/theme';
import { MilyButton } from '../../components/ui/MilyButton';
import { MilyCard } from '../../components/ui/MilyCard';

interface AgreementReflectScreenProps {
  isChild: boolean;
  agreementSummary: string;
  onSubmit: (note: string) => void;
  onSkip: () => void;
}

export function AgreementReflectScreen({ isChild, agreementSummary, onSubmit, onSkip }: AgreementReflectScreenProps) {
  const [note, setNote] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.icon}>🤝</Text>
          <Text style={styles.title}>합의가 완료됐어요!</Text>
          <MilyCard>
            <Text style={styles.summaryLabel}>합의 내용</Text>
            <Text style={styles.summaryText}>{agreementSummary}</Text>
          </MilyCard>

          <Text style={styles.reflectTitle}>이번 합의 어땠나요?</Text>
          <Text style={styles.reflectDesc}>{isChild ? '느낀 점을 자유롭게 써봐요' : '한 마디 남겨볼까요?'}</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            placeholder={isChild ? '고마워요 / 다음엔 더 잘 준비할게요...' : '잘 했어요 / 다음엔 같이 계획해봐요...'}
            placeholderTextColor={theme.milyColors.brownLight}
          />
        </ScrollView>

        <View style={styles.footer}>
          <MilyButton label="기록하기" onPress={() => onSubmit(note)} disabled={note.trim().length === 0} />
          <MilyButton label="건너뛰기" variant="ghost" onPress={onSkip} style={{ marginTop: 4 }} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.milyColors.cream },
  content: { padding: 24, alignItems: 'center' },
  icon: { fontSize: 56, marginTop: 32, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: theme.milyColors.brownDark, marginBottom: 20 },
  summaryLabel: { fontSize: 12, color: theme.milyColors.brownMid, marginBottom: 6 },
  summaryText: { fontSize: 15, color: theme.milyColors.brownDark, lineHeight: 22 },
  reflectTitle: { fontSize: 16, fontWeight: '600', color: theme.milyColors.brownDark, marginTop: 20, marginBottom: 6, alignSelf: 'flex-start' },
  reflectDesc: { fontSize: 13, color: theme.milyColors.brownMid, marginBottom: 10, alignSelf: 'flex-start' },
  noteInput: { width: '100%', backgroundColor: '#fff', borderRadius: theme.borderRadius.input, padding: 12, fontSize: 14, color: theme.milyColors.brownDark, minHeight: 80, textAlignVertical: 'top' },
  footer: { padding: 16, gap: 4 },
});
