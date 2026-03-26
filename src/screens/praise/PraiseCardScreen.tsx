// PraiseCardScreen.tsx — 칭찬 카드 (부모→자녀, 3버튼)
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { theme } from '../../ui/theme';
import { MilyButton } from '../../components/ui/MilyButton';
import { MilyCard } from '../../components/ui/MilyCard';

type PraiseType = 'well_saved' | 'good_effort' | 'thank_you';

interface PraiseCardScreenProps {
  childName: string;
  ageBand?: 'child_young' | 'child_mid' | 'teen' | 'young_adult';
  onSend: (type: PraiseType, message: string) => void;
  onCancel: () => void;
}

const PRAISE_TYPES: { key: PraiseType; emoji: string; label: string }[] = [
  { key: 'well_saved', emoji: '💰', label: '잘 아꼈어요' },
  { key: 'good_effort', emoji: '💪', label: '잘 노력했어요' },
  { key: 'thank_you', emoji: '💛', label: '고마워요' },
];

const SUGGESTED_MESSAGES: Record<PraiseType, string[]> = {
  well_saved: ['이번 주 정말 잘 아꼈네!', '절약하는 모습이 멋져요', '용돈을 알뜰하게 썼네요'],
  good_effort: ['꾸준히 기록하는 모습이 대단해요', '약속을 잘 지켜줘서 기뻐요', '노력하는 게 보여요!'],
  thank_you: ['함께해줘서 고마워', '열심히 해줘서 감사해요', '든든한 가족이에요'],
};

export function PraiseCardScreen({ childName, ageBand, onSend, onCancel }: PraiseCardScreenProps) {
  const [type, setType] = useState<PraiseType | null>(null);
  const [message, setMessage] = useState('');

  const suggestions = type ? SUGGESTED_MESSAGES[type] : [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{childName}에게 칭찬 카드</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>어떤 칭찬인가요?</Text>
        <View style={styles.typeRow}>
          {PRAISE_TYPES.map((pt) => (
            <TouchableOpacity
              key={pt.key}
              style={[styles.typeCard, type === pt.key && styles.typeCardSelected]}
              onPress={() => { setType(pt.key); setMessage(''); }}
            >
              <Text style={styles.typeEmoji}>{pt.emoji}</Text>
              <Text style={[styles.typeLabel, type === pt.key && styles.typeLabelSelected]}>{pt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 추천 문구 */}
        {suggestions.length > 0 && (
          <MilyCard>
            <Text style={styles.suggestTitle}>추천 문구</Text>
            {suggestions.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.suggestOption, message === s && styles.suggestOptionSelected]}
                onPress={() => setMessage(s)}
              >
                <Text style={styles.suggestText}>{s}</Text>
                {message === s && <Text style={styles.suggestCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </MilyCard>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <MilyButton
          label="칭찬 카드 보내기 💌"
          onPress={() => type && message && onSend(type, message)}
          disabled={!type || !message}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.milyColors.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.milyColors.surface2 },
  cancelBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  cancelText: { fontSize: 18, color: theme.milyColors.brownMid },
  headerTitle: { fontSize: 17, fontWeight: '600', color: theme.milyColors.brownDark },
  content: { padding: 16, gap: 12 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: theme.milyColors.brownDark },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeCard: { flex: 1, backgroundColor: '#fff', borderRadius: theme.borderRadius.card, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  typeCardSelected: { borderColor: theme.milyColors.coral, backgroundColor: theme.milyColors.coral + '10' },
  typeEmoji: { fontSize: 28, marginBottom: 6 },
  typeLabel: { fontSize: 13, fontWeight: '500', color: theme.milyColors.brownDark, textAlign: 'center' },
  typeLabelSelected: { color: theme.milyColors.coral },
  suggestTitle: { fontSize: 13, fontWeight: '600', color: theme.milyColors.brownDark, marginBottom: 8 },
  suggestOption: { paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: theme.milyColors.surface2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  suggestOptionSelected: { backgroundColor: theme.milyColors.surface2, borderRadius: 8, paddingHorizontal: 8 },
  suggestText: { fontSize: 14, color: theme.milyColors.brownDark },
  suggestCheck: { fontSize: 16, color: theme.milyColors.coral },
  footer: { padding: 16 },
});
