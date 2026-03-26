// ──────────────────────────────────────────────
// FamilyBankScreen.tsx — 가족 약속 기록함
// pending/active/completed 탭 + 신뢰 레벨 배지
// Feature Flag: FAMILY_BANK_ENABLED
// ──────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ScreenLayout } from '../../ui/layouts/ScreenLayout';
import { theme } from '../../ui/theme';
import { filterDna } from '../../engines/message/dnaFilter';
import {
  FamilyContract,
  ContractStatus,
} from '../../engines/familyBank/familyBankService';
import { TrustLevel } from '../../engines/familyBank/trustScoreService';

// ── 타입 ──────────────────────────────────────

export interface FamilyBankScreenProps {
  contracts: FamilyContract[];
  trustLevel: TrustLevel;
  loading?: boolean;
  onCreateContract?: () => void;
}

// ── 상수 ──────────────────────────────────────

const STATUS_TABS: { key: ContractStatus; label: string }[] = [
  { key: 'pending', label: '대기중' },
  { key: 'active', label: '진행중' },
  { key: 'completed', label: '완료' },
];

const TRUST_BADGES: Record<TrustLevel, { emoji: string; label: string }> = {
  1: { emoji: '🌱', label: '씨앗' },
  2: { emoji: '🌿', label: '새싹' },
  3: { emoji: '🌳', label: '나무' },
  4: { emoji: '⭐', label: '자립' },
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  loan: '빌리기 약속',
  interest: '모으기 약속',
  chore_reward: '심부름 보상',
};

// ── 신뢰 레벨 배지 ──────────────────────────

function TrustBadge({ level }: { level: TrustLevel }) {
  const badge = TRUST_BADGES[level];
  return (
    <View style={styles.trustBadge}>
      <Text style={styles.trustEmoji}>{badge.emoji}</Text>
      <Text style={styles.trustLabel}>{badge.label}</Text>
    </View>
  );
}

// ── 계약 카드 ────────────────────────────────

function ContractCard({ contract }: { contract: FamilyContract }) {
  const typeLabel = CONTRACT_TYPE_LABELS[contract.type] ?? contract.type;
  const paidCount = contract.repayments.length;
  const progress = contract.totalMonths > 0 ? paidCount / contract.totalMonths : 0;

  return (
    <View style={styles.contractCard}>
      <View style={styles.contractHeader}>
        <Text style={styles.contractTitle}>{contract.title}</Text>
        <Text style={styles.contractType}>{typeLabel}</Text>
      </View>
      <Text style={styles.contractAmount}>
        {contract.amount.toLocaleString()}원
      </Text>
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${Math.round(progress * 100)}%` },
          ]}
        />
      </View>
      <Text style={styles.contractProgress}>
        {paidCount} / {contract.totalMonths}회 이행
      </Text>
    </View>
  );
}

// ── 메인 화면 ────────────────────────────────

export function FamilyBankScreen({
  contracts,
  trustLevel,
  loading,
  onCreateContract,
}: FamilyBankScreenProps) {
  const [activeTab, setActiveTab] = useState<ContractStatus>('active');

  if (loading) {
    return (
      <ScreenLayout>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenLayout>
    );
  }

  const filtered = contracts.filter((c) => c.status === activeTab);

  return (
    <ScreenLayout>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>가족 약속 기록함</Text>

        {/* 신뢰 레벨 */}
        <TrustBadge level={trustLevel} />

        {/* 상태 탭 */}
        <View style={styles.tabRow}>
          {STATUS_TABS.map((tab) => {
            const count = contracts.filter((c) => c.status === tab.key).length;
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 계약 목록 */}
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'pending' && '대기 중인 약속이 없어요.'}
              {activeTab === 'active' && '진행 중인 약속이 없어요.'}
              {activeTab === 'completed' && '완료된 약속이 없어요.'}
            </Text>
          </View>
        ) : (
          filtered.map((c) => <ContractCard key={c.id} contract={c} />)
        )}

        {/* 새 약정서 생성 */}
        <TouchableOpacity style={styles.createBtn} onPress={onCreateContract}>
          <Text style={styles.createBtnText}>+ 새 약속 만들기</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenLayout>
  );
}

// ── 스타일 ─────────────────────────────────

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  screenTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.textPrimary, marginTop: 16, marginBottom: 12 },

  // Trust badge
  trustBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.card, padding: 12, marginBottom: 16 },
  trustEmoji: { fontSize: 28, marginRight: 12 },
  trustLabel: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary },

  // Tabs
  tabRow: { flexDirection: 'row', marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: theme.colors.primary },
  tabText: { fontSize: 14, color: theme.colors.textSecondary },
  tabTextActive: { color: theme.colors.primary, fontWeight: '600' },

  // Empty
  emptyContainer: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 14, color: theme.colors.textSecondary },

  // Contract card
  contractCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.card, padding: 16, marginBottom: 12 },
  contractHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  contractTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary },
  contractType: { fontSize: 12, color: theme.colors.textSecondary, backgroundColor: theme.colors.border, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  contractAmount: { fontSize: 20, fontWeight: '700', color: theme.colors.primary, marginBottom: 8 },
  progressBarBg: { height: 8, backgroundColor: theme.colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  progressBarFill: { height: 8, backgroundColor: theme.colors.secondary, borderRadius: 4 },
  contractProgress: { fontSize: 12, color: theme.colors.textSecondary },

  // Create button
  createBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.button, paddingVertical: 14, alignItems: 'center', marginTop: 8, marginBottom: 24 },
  createBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
