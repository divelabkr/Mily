import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../src/ui/theme';
import { useAuthStore } from '../../../src/engines/auth/authStore';

const ROLES = [
  {
    key: 'individual' as const,
    emoji: '🙋',
    label: '나 혼자',
    desc: '개인 소비를 기록하고 돌아봐요',
  },
  {
    key: 'parent' as const,
    emoji: '👨‍👩‍👧',
    label: '자녀와 함께',
    desc: '가족이 함께 돈 얘기를 나눠요',
  },
  {
    key: 'child' as const,
    emoji: '🧒',
    label: '자녀로 참여하기',
    desc: '부모님이 보내준 초대 코드로 입장해요',
  },
];

export default function RoleSelectScreen() {
  const router = useRouter();
  const setRole = useAuthStore((s) => s.setRole);

  const handleSelect = (key: 'individual' | 'parent' | 'child') => {
    setRole(key);
    if (key === 'child') {
      router.push('/(auth)/onboarding/child-join');
    } else {
      router.push('/(auth)/onboarding/first-plan');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>어떻게 사용하실 건가요?</Text>
          <Text style={styles.sub}>나중에 바꿀 수 있어요</Text>
        </View>

        <View style={styles.cards}>
          {ROLES.map((role) => (
            <TouchableOpacity
              key={role.key}
              style={styles.card}
              onPress={() => handleSelect(role.key)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={role.label}
            >
              <View style={styles.coralBar} />
              <Text style={styles.cardEmoji}>{role.emoji}</Text>
              <View style={styles.cardText}>
                <Text style={styles.cardLabel}>{role.label}</Text>
                <Text style={styles.cardDesc}>{role.desc}</Text>
              </View>
              <Text style={styles.cardArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.milyColors.cream,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.milyColors.brownDark,
    marginBottom: 6,
  },
  sub: {
    fontSize: 14,
    color: theme.milyColors.brownMid,
  },
  cards: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.card,
    overflow: 'hidden',
    minHeight: 76,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  coralBar: {
    width: 5,
    alignSelf: 'stretch',
    backgroundColor: theme.milyColors.coral,
  },
  cardEmoji: {
    fontSize: 28,
    marginHorizontal: 16,
  },
  cardText: {
    flex: 1,
    paddingVertical: 14,
  },
  cardLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.milyColors.brownDark,
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 13,
    color: theme.milyColors.brownMid,
  },
  cardArrow: {
    fontSize: 22,
    color: theme.milyColors.brownLight,
    paddingRight: 16,
    fontWeight: '300',
  },
});
