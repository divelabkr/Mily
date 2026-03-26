// RoleSelectScreen.tsx — 역할 선택 (혼자 / 자녀와 함께)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { theme } from '../../ui/theme';
import { MilyButton } from '../../components/ui/MilyButton';

export type UserRole = 'solo' | 'family';

interface RoleSelectScreenProps {
  onSelect: (role: UserRole) => void;
}

const ROLES: { key: UserRole; emoji: string; title: string; desc: string }[] = [
  { key: 'solo', emoji: '🧍', title: '혼자 쓸게요', desc: '나 혼자 소비를 기록하고 회고해요' },
  { key: 'family', emoji: '👨‍👩‍👧', title: '자녀와 함께', desc: '가족 연결 후 함께 사용해요' },
];

export function RoleSelectScreen({ onSelect }: RoleSelectScreenProps) {
  const [selected, setSelected] = useState<UserRole | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>어떻게 사용하실 건가요?</Text>
        <Text style={styles.subtitle}>나중에 언제든 바꿀 수 있어요</Text>
        <View style={styles.cards}>
          {ROLES.map((role) => (
            <TouchableOpacity
              key={role.key}
              style={[styles.card, selected === role.key && styles.cardSelected]}
              onPress={() => setSelected(role.key)}
              activeOpacity={0.8}
            >
              <View style={[styles.colorBar, selected === role.key && styles.colorBarSelected]} />
              <View style={styles.cardBody}>
                <Text style={styles.cardEmoji}>{role.emoji}</Text>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, selected === role.key && styles.cardTitleSelected]}>{role.title}</Text>
                  <Text style={styles.cardDesc}>{role.desc}</Text>
                </View>
                {selected === role.key && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        <MilyButton label="다음" onPress={() => selected && onSelect(selected)} disabled={!selected} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.milyColors.cream },
  content: { flex: 1, padding: 24, paddingTop: 48 },
  title: { fontSize: 24, fontWeight: '700', color: theme.milyColors.brownDark, marginBottom: 8 },
  subtitle: { fontSize: 14, color: theme.milyColors.brownMid, marginBottom: 32 },
  cards: { gap: 16 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: theme.borderRadius.card, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  cardSelected: { borderColor: theme.milyColors.coral },
  colorBar: { width: 6, backgroundColor: theme.milyColors.brownLight },
  colorBarSelected: { backgroundColor: theme.milyColors.coral },
  cardBody: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  cardEmoji: { fontSize: 32 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: theme.milyColors.brownDark, marginBottom: 4 },
  cardTitleSelected: { color: theme.milyColors.coral },
  cardDesc: { fontSize: 13, color: theme.milyColors.brownMid },
  checkmark: { fontSize: 20, color: theme.milyColors.coral, fontWeight: '700' },
  footer: { padding: 24 },
});
