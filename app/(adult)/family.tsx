import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Share, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenLayout } from '../../src/ui/layouts/ScreenLayout';
import { Card } from '../../src/ui/components/Card';
import { Button } from '../../src/ui/components/Button';
import { EmptyState } from '../../src/ui/components/EmptyState';
import { ProgressBar } from '../../src/ui/components/ProgressBar';
import { RequestCardView } from '../../src/ui/components/RequestCardView';
import { theme } from '../../src/ui/theme';
import { useAuthStore } from '../../src/engines/auth/authStore';
import { useFamilyStore } from '../../src/engines/family/familyStore';
import {
  createFamily,
  loadFamily,
} from '../../src/engines/family/familyService';
import { useRequestCardStore } from '../../src/engines/requestCard/requestCardStore';
import {
  loadRequestCards,
  respondToCard,
} from '../../src/engines/requestCard/requestCardService';
import { sendPraiseCard, loadPraiseCards } from '../../src/engines/praiseCard/praiseCardService';
import { usePraiseCardStore, PraiseCardType } from '../../src/engines/praiseCard/praiseCardStore';
import {
  evaluatePaywallTrigger,
} from '../../src/engines/billing/paywallTriggers';
import { Events } from '../../src/engines/analytics/analyticsService';
import { loadFamilyAchievements } from '../../src/engines/achievement/achievementService';
import { findAchievement } from '../../src/engines/achievement/achievementDefinitions';
import { UserAchievement } from '../../src/engines/achievement/achievementTypes';
import { getWeekId } from '../../src/utils/dateUtils';

export default function FamilyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const family = useFamilyStore((s) => s.family);
  const cards = useRequestCardStore((s) => s.cards);
  const [loading, setLoading] = useState(false);
  const [praiseSending, setPraiseSending] = useState<string | null>(null); // targetUid
  // uid → 이번 주 공유된 업적 목록
  const [familyAchievements, setFamilyAchievements] = useState<Record<string, UserAchievement[]>>({});

  useEffect(() => {
    if (user?.familyId) {
      loadFamily(user.familyId);
      loadRequestCards(user.familyId);
      loadPraiseCards(user.familyId);
    }
  }, [user?.familyId]);

  // 가족 구성원 업적 로드 (멤버 목록이 갱신될 때)
  useEffect(() => {
    if (!family || family.members.length <= 1) return;
    const otherUids = family.members
      .filter((m) => m.uid !== user?.uid)
      .map((m) => m.uid);
    loadFamilyAchievements(otherUids).then(setFamilyAchievements);
  }, [family?.members.length]);

  const currentWeekStart = (() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // 월요일 기준
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.getTime();
  })();

  // 이번 주 달성한 공유 업적만 필터
  function getThisWeekAchievements(uid: string): UserAchievement[] {
    return (familyAchievements[uid] ?? []).filter(
      (ua) => ua.unlockedAt >= currentWeekStart
    );
  }

  const handleSendPraise = async (toUid: string, type: PraiseCardType) => {
    if (!user || !family) return;
    setPraiseSending(toUid);
    try {
      await sendPraiseCard(family.familyId, user.uid, toUid, type);
      await Events.praiseCardSent(type);
      Alert.alert('', t('praise_card_sent_confirm'));
    } finally {
      setPraiseSending(null);
    }
  };

  const handleCreateFamily = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const newFamily = await createFamily(user.uid, user.displayName);
      await Events.familyLinked(newFamily.memberUids.length);

      // 트리거 B: 가족 연결 직후 페이월 체크
      if (evaluatePaywallTrigger('family_linked', true)) {
        router.push('/(adult)/paywall');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShareCode = async () => {
    if (!family) return;
    await Share.share({
      message: `Mily 가족 초대 코드: ${family.inviteCode}\n자녀 앱에서 코드를 입력하면 연결돼요.`,
    });
  };

  if (!family) {
    return (
      <ScreenLayout>
        <View style={styles.container}>
          <Text style={styles.title}>{t('family_title')}</Text>
          <EmptyState message={t('empty_family_no_members')} />
          <Button
            title={t('family_invite')}
            onPress={handleCreateFamily}
            loading={loading}
          />
        </View>
      </ScreenLayout>
    );
  }

  const pendingCards = cards.filter((c) => c.status === 'pending');
  const respondedCards = cards.filter((c) => c.status !== 'pending');

  return (
    <ScreenLayout>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('family_title')}</Text>

        {/* 초대 코드 카드 */}
        <Card style={styles.inviteCard}>
          <Text style={styles.inviteLabel}>{t('family_invite_code_label')}</Text>
          <Text style={styles.inviteCode}>{family.inviteCode}</Text>
          <Button
            title={t('family_invite')}
            onPress={handleShareCode}
            variant="outline"
            style={styles.shareButton}
          />
        </Card>

        {/* 가족 구성원 요약 */}
        {family.members.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('family_weekly_summary')}</Text>
            {family.members
              .filter((m) => m.role === 'child')
              .map((member) => (
                <Card key={member.uid} style={styles.memberCard}>
                  <View style={styles.memberRow}>
                    <Text style={styles.memberName}>{member.displayName}</Text>
                    <Text style={styles.memberRate}>
                      {/* TODO: 실제 달성률 — privacySettings 기반 */}
                      달성률 집계 중
                    </Text>
                  </View>
                  <ProgressBar progress={0.7} />
                  <Text style={styles.memberNote}>
                    자녀가 공유 설정한 항목만 표시돼요.
                  </Text>

                  {/* 이번 주 달성 업적 */}
                  {getThisWeekAchievements(member.uid).length > 0 && (
                    <View style={styles.weeklyAchievements}>
                      <Text style={styles.weeklyAchievementsLabel}>이번 주 달성 업적</Text>
                      <View style={styles.achievementChips}>
                        {getThisWeekAchievements(member.uid).map((ua) => {
                          const def = findAchievement(ua.achievementId);
                          if (!def) return null;
                          return (
                            <View key={ua.achievementId} style={styles.achievementChip}>
                              <Text style={styles.achievementChipText}>
                                🏆 {def.title}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* 칭찬 보내기 3버튼 */}
                  <Text style={styles.praiseLabel}>{t('praise_card_title')}</Text>
                  <View style={styles.praiseRow}>
                    {(
                      [
                        { type: 'well_saved' as PraiseCardType, labelKey: 'praise_card_well_saved' },
                        { type: 'good_effort' as PraiseCardType, labelKey: 'praise_card_good_effort' },
                        { type: 'thank_you' as PraiseCardType, labelKey: 'praise_card_thank_you' },
                      ]
                    ).map((p) => (
                      <TouchableOpacity
                        key={p.type}
                        style={styles.praiseBtn}
                        onPress={() => handleSendPraise(member.uid, p.type)}
                        disabled={praiseSending === member.uid}
                        accessibilityLabel={t(p.labelKey)}
                        accessibilityRole="button"
                      >
                        <Text style={styles.praiseBtnLabel}>{t(p.labelKey)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Card>
              ))}
          </View>
        )}

        {/* 받은 요청 카드 */}
        {pendingCards.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>받은 요청</Text>
            {pendingCards.map((card) => (
              <RequestCardView
                key={card.id}
                card={card}
                isParentView
                onCheer={() =>
                  respondToCard(family.familyId, card.id, 'cheered')
                }
                onHold={() =>
                  respondToCard(family.familyId, card.id, 'held')
                }
                onAdjust={() =>
                  respondToCard(family.familyId, card.id, 'adjusting')
                }
              />
            ))}
          </View>
        )}

        {/* 처리된 요청 히스토리 */}
        {respondedCards.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>지난 요청</Text>
            {respondedCards.slice(0, 5).map((card) => (
              <RequestCardView key={card.id} card={card} isParentView={false} />
            ))}
          </View>
        )}

        {pendingCards.length === 0 && respondedCards.length === 0 && (
          <EmptyState message={t('empty_request_no_cards')} />
        )}

        <Text style={styles.disclaimer}>{t('not_financial_service')}</Text>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: theme.spacing[6] },
  scroll: { flex: 1, paddingTop: theme.spacing[6] },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[5],
  },
  inviteCard: {
    marginBottom: theme.spacing[5],
    alignItems: 'center',
  },
  inviteLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing[2],
  },
  inviteCode: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 4,
    marginBottom: theme.spacing[3],
  },
  shareButton: { minWidth: 160 },
  section: { marginBottom: theme.spacing[5] },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[3],
  },
  memberCard: { marginBottom: theme.spacing[3] },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[3],
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  memberRate: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  memberNote: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing[2],
  },
  praiseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
  },
  praiseRow: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  praiseBtn: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.button,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    backgroundColor: '#F0F9F7',
  },
  praiseBtnLabel: {
    fontSize: 12,
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  weeklyAchievements: {
    marginTop: theme.spacing[3],
    marginBottom: theme.spacing[1],
  },
  weeklyAchievementsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing[2],
  },
  achievementChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  achievementChip: {
    backgroundColor: '#FFF8EC',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#F4C542',
  },
  achievementChipText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  disclaimer: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[6],
  },
});
