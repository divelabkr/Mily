import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScreenLayout } from '../../src/ui/layouts/ScreenLayout';
import { Button } from '../../src/ui/components/Button';
import { Card } from '../../src/ui/components/Card';
import { EmptyState } from '../../src/ui/components/EmptyState';
import { RequestCardView } from '../../src/ui/components/RequestCardView';
import { theme } from '../../src/ui/theme';
import { useAuthStore } from '../../src/engines/auth/authStore';
import { useFamilyStore } from '../../src/engines/family/familyStore';
import { loadFamily } from '../../src/engines/family/familyService';
import {
  useRequestCardStore,
  RequestType,
} from '../../src/engines/requestCard/requestCardStore';
import {
  sendRequestCard,
  loadRequestCards,
} from '../../src/engines/requestCard/requestCardService';

const REQUEST_TYPE_KEYS: {
  type: RequestType;
  labelKey: string;
  urgent?: boolean;
  emoji: string;
}[] = [
  { type: 'extra_budget',   labelKey: 'request_type_extra_budget',   emoji: '💰' },
  { type: 'plan_change',    labelKey: 'request_type_plan_change',    emoji: '📋' },
  { type: 'reward',         labelKey: 'request_type_reward',         emoji: '🎁' },
  { type: 'purchase_check', labelKey: 'request_type_purchase_check', emoji: '🛒' },
  { type: 'urgent',         labelKey: 'request_type_urgent',         emoji: '🚨', urgent: true },
];

const TYPE_PLACEHOLDERS: Record<RequestType, string> = {
  extra_budget:   '추가로 얼마나 필요한지, 왜 필요한지 적어줘요.',
  plan_change:    '어떻게 바꾸고 싶은지 적어줘요.',
  reward:         '어떤 보상을 받고 싶은지 적어줘요.',
  purchase_check: '어떤 걸 사고 싶은지, 얼마인지 적어줘요. 같이 고민해봐요.',
  urgent:         '지금 바로 필요한 이유를 꼭 적어줘요. (이유 필수)',
};

export default function ChildRequestScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const family = useFamilyStore((s) => s.family);
  const cards = useRequestCardStore((s) => s.cards);

  const [showForm, setShowForm] = useState(false);
  const [requestText, setRequestText] = useState('');
  const [requestType, setRequestType] = useState<RequestType>('extra_budget');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user?.familyId) {
      loadFamily(user.familyId);
      loadRequestCards(user.familyId);
    }
  }, [user?.familyId]);

  // urgent는 이유 필수 — 빈 텍스트 전송 불가 (모든 타입 공통이지만 urgent는 별도 안내)
  const isUrgent = requestType === 'urgent';
  const canSend = requestText.trim().length > 0;

  const handleSend = async () => {
    if (!user || !family || !canSend) return;
    const parentUid = family.members.find((m) => m.role === 'parent')?.uid;
    if (!parentUid) return;

    setSending(true);
    try {
      await sendRequestCard(
        family.familyId,
        user.uid,
        parentUid,
        requestText.trim(),
        requestType,
        user.displayName
      );
      setSent(true);
      setShowForm(false);
      setRequestText('');
    } finally {
      setSending(false);
    }
  };

  if (!family) {
    return (
      <ScreenLayout>
        <View style={styles.container}>
          <Text style={styles.title}>{t('request_title')}</Text>
          <EmptyState message="부모님과 가족 연결이 필요해요." />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <ScrollView style={styles.scroll}>
        <Text style={styles.title}>{t('request_title')}</Text>

        {sent && (
          <Card style={styles.sentCard}>
            <Text style={styles.sentText}>요청을 보냈어요! 부모님 응답을 기다려볼게요.</Text>
          </Card>
        )}

        {cards.length === 0 && !showForm && (
          <EmptyState message={t('empty_request_no_cards')} />
        )}

        {cards.map((card) => (
          <RequestCardView key={card.id} card={card} isParentView={false} />
        ))}

        {showForm && (
          <Card style={styles.form}>
            <Text style={styles.formLabel}>요청 유형</Text>
            <View style={styles.typeGrid}>
              {REQUEST_TYPE_KEYS.map((rt) => (
                <TouchableOpacity
                  key={rt.type}
                  style={[
                    styles.typeChip,
                    requestType === rt.type && styles.typeChipSelected,
                    rt.urgent && styles.typeChipUrgent,
                    rt.urgent && requestType === rt.type && styles.typeChipUrgentSelected,
                  ]}
                  onPress={() => setRequestType(rt.type)}
                  accessibilityLabel={t(rt.labelKey)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: requestType === rt.type }}
                >
                  <Text style={styles.typeEmoji}>{rt.emoji}</Text>
                  <Text
                    style={[
                      styles.typeLabel,
                      requestType === rt.type && styles.typeLabelSelected,
                    ]}
                  >
                    {t(rt.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* urgent 이유 필수 안내 */}
            {isUrgent && (
              <View style={styles.urgentBanner}>
                <Text style={styles.urgentBannerText}>
                  🚨 긴급 요청은 부모님께 즉시 알림이 가요. 이유를 꼭 적어주세요.
                </Text>
              </View>
            )}

            {/* purchase_check 구매 고민 안내 */}
            {requestType === 'purchase_check' && (
              <View style={styles.purchaseBanner}>
                <Text style={styles.purchaseBannerText}>
                  🛒 뭘 살지 같이 고민해봐요. 부모님께 미리 물어보는 거예요.
                </Text>
              </View>
            )}

            <TextInput
              style={[styles.textInput, isUrgent && styles.textInputUrgent]}
              placeholder={TYPE_PLACEHOLDERS[requestType]}
              placeholderTextColor={theme.colors.textSecondary}
              value={requestText}
              onChangeText={setRequestText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.formButtons}>
              <Button
                title={isUrgent ? '🚨 즉시 전송' : t('request_send')}
                onPress={handleSend}
                disabled={!canSend}
                loading={sending}
                style={styles.sendButton}
              />
              <Button
                title={t('common_cancel')}
                onPress={() => setShowForm(false)}
                variant="outline"
              />
            </View>
          </Card>
        )}
      </ScrollView>

      {!showForm && (
        <View style={styles.footer}>
          <Button
            title={t('request_new')}
            onPress={() => {
              setSent(false);
              setShowForm(true);
            }}
          />
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: theme.spacing[6],
  },
  scroll: {
    flex: 1,
    paddingTop: theme.spacing[6],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[5],
  },
  sentCard: {
    backgroundColor: '#F0FAF0',
    borderColor: theme.colors.success,
    borderWidth: 1,
    marginBottom: theme.spacing[4],
  },
  sentText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  form: {
    marginBottom: theme.spacing[4],
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing[3],
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[4],
  },
  typeChip: {
    minWidth: '30%',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.button,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 2,
  },
  typeEmoji: {
    fontSize: 16,
  },
  typeChipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#EDF2F9',
  },
  typeChipUrgent: {
    borderColor: theme.colors.warning,
  },
  typeChipUrgentSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: '#FEF3E5',
  },
  typeLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  typeLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  textInput: {
    height: 100,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing[3],
    fontSize: 14,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing[4],
  },
  textInputUrgent: {
    borderColor: theme.colors.warning,
    borderWidth: 2,
  },
  urgentBanner: {
    backgroundColor: '#FEF3E5',
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing[3],
    marginBottom: theme.spacing[3],
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.warning,
  },
  urgentBannerText: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 17,
  },
  purchaseBanner: {
    backgroundColor: '#EEF4FF',
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing[3],
    marginBottom: theme.spacing[3],
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  purchaseBannerText: {
    fontSize: 12,
    color: theme.colors.primary,
    lineHeight: 17,
  },
  formButtons: {
    gap: theme.spacing[2],
  },
  sendButton: {
    marginBottom: theme.spacing[2],
  },
  footer: {
    paddingVertical: theme.spacing[4],
  },
});
