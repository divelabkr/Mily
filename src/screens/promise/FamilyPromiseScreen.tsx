// FamilyPromiseScreen.tsx — 가족 약속 기록함
// 약속 이행 기록 이모지 단계 + 진행 중 약속 + 새 약속 만들기
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { theme } from '../../ui/theme';
import { DarkCard } from '../../components/ui/DarkCard';
import { MilyCard } from '../../components/ui/MilyCard';
import { MilyButton } from '../../components/ui/MilyButton';
import { MilyBadge } from '../../components/ui/MilyBadge';
import { FamilyContract, ContractStatus } from '../../engines/familyBank/familyBankService';
import { TrustLevel } from '../../engines/familyBank/trustScoreService';

interface FamilyPromiseScreenProps {
  contracts: FamilyContract[];
  trustLevel: TrustLevel;
  loading?: boolean;
  onCreatePromise?: () => void;
}

type PromiseKind = '모으기' | '빌리기' | '도전';

const CONTRACT_KIND_LABELS: Record<string, PromiseKind> = {
  loan: '빌리기',
  interest: '모으기',
  chore_reward: '도전',
};

const TRUST_STEPS: Record<TrustLevel, { emoji: string; label: string }> = {
  1: { emoji: '🌱', label: '씨앗' },
  2: { emoji: '🌿', label: '새싹' },
  3: { emoji: '🌳', label: '나무' },
  4: { emoji: '🌲', label: '숲' },
};

const STATUS_TABS: { key: ContractStatus; label: string }[] = [
  { key: 'active', label: '진행 중' },
  { key: 'pending', label: '대기 중' },
  { key: 'completed', label: '완료' },
];

function PromiseCard({ contract }: { contract: FamilyContract }) {
  const kind = CONTRACT_KIND_LABELS[contract.type] ?? '약속';
  const progress = contract.totalMonths > 0 ? contract.repayments.length / contract.totalMonths : 0;

  return (
    <MilyCard>
      <View style={styles.promiseCardHeader}>
        <Text style={styles.promiseCardTitle}>{contract.title}</Text>
        <MilyBadge label={kind} variant={kind === '모으기' ? 'mint' : kind === '빌리기' ? 'coral' : 'gold'} />
      </View>
      <Text style={styles.promiseCardAmount}>{contract.amount.toLocaleString()}원</Text>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
      <Text style={styles.promiseCardProgress}>
        {contract.repayments.length} / {contract.totalMonths}회 이행
      </Text>
    </MilyCard>
  );
}

export function FamilyPromiseScreen({ contracts, trustLevel, loading, onCreatePromise }: FamilyPromiseScreenProps) {
  const [tab, setTab] = useState<ContractStatus>('active');

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.milyColors.coral} />
        </View>
      </SafeAreaView>
    );
  }

  const step = TRUST_STEPS[trustLevel];
  const filtered = contracts.filter((c) => c.status === tab);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.screenTitle}>가족 약속 기록함</Text>

        {/* 약속 이행 기록 이모지 단계 */}
        <DarkCard>
          <View style={styles.trustRow}>
            <Text style={styles.trustEmoji}>{step.emoji}</Text>
            <View style={styles.trustInfo}>
              <Text style={styles.trustLabel}>{step.label} 단계</Text>
              <Text style={styles.trustDesc}>약속을 꾸준히 이어가고 있어요</Text>
            </View>
          </View>
        </DarkCard>

        {/* 탭 */}
        <View style={styles.tabRow}>
          {STATUS_TABS.map((t) => {
            const count = contracts.filter((c) => c.status === t.key).length;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
                onPress={() => setTab(t.key)}
              >
                <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                  {t.label} {count > 0 ? `(${count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 약속 목록 */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{tab === 'active' ? '진행 중인 약속이 없어요.' : tab === 'pending' ? '대기 중인 약속이 없어요.' : '완료된 약속이 없어요.'}</Text>
          </View>
        ) : (
          filtered.map((c) => <PromiseCard key={c.id} contract={c} />)
        )}

        <MilyButton label="+ 새 약속 만들기" onPress={onCreatePromise ?? (() => {})} style={styles.createBtn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.milyColors.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 32 },
  screenTitle: { fontSize: 22, fontWeight: '700', color: theme.milyColors.brownDark, marginBottom: 16 },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  trustEmoji: { fontSize: 36 },
  trustInfo: {},
  trustLabel: { fontSize: 16, fontWeight: '600', color: '#fff' },
  trustDesc: { fontSize: 13, color: theme.milyColors.brownLight, marginTop: 2 },
  tabRow: { flexDirection: 'row', marginBottom: 14 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: theme.milyColors.coral },
  tabText: { fontSize: 14, color: theme.milyColors.brownMid },
  tabTextActive: { color: theme.milyColors.coral, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 14, color: theme.milyColors.brownMid },
  promiseCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  promiseCardTitle: { fontSize: 15, fontWeight: '600', color: theme.milyColors.brownDark, flex: 1, marginRight: 8 },
  promiseCardAmount: { fontSize: 20, fontWeight: '700', color: theme.milyColors.coral, marginBottom: 10 },
  progressBg: { height: 8, backgroundColor: theme.milyColors.surface2, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: 8, backgroundColor: theme.milyColors.mint, borderRadius: 4 },
  promiseCardProgress: { fontSize: 12, color: theme.milyColors.brownMid },
  createBtn: { marginTop: 8 },
});
