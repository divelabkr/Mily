import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenLayout } from '../../src/ui/layouts/ScreenLayout';
import { Button } from '../../src/ui/components/Button';
import { theme } from '../../src/ui/theme';

import { LEGAL_URLS } from '../../src/constants/urls';

const PRIVACY_POLICY_URL = LEGAL_URLS.privacy;
const TERMS_OF_SERVICE_URL = LEGAL_URLS.terms;

async function openUrl(url: string) {
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert('링크를 열 수 없어요', '브라우저에서 직접 확인해주세요.');
  }
}

export default function TermsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <ScreenLayout>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 금융 서비스 아님 고지 — 최상단 */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️ {t('not_financial_service')}
          </Text>
          <Text style={styles.disclaimerSub}>
            Mily는 돈을 보관하거나 이동시키지 않습니다. 금융 투자, 대출,
            저축 상품과 무관합니다.
          </Text>
        </View>

        <Text style={styles.title}>이용약관</Text>
        <Text style={styles.body}>
          Mily 앱("서비스")은 가족과 개인이 소비 습관을 돌아보는 것을 돕는
          행동 코칭 앱입니다.{'\n\n'}
          본 서비스는 자본시장법, 전자금융거래법, 은행법 등 금융 관련 법령의
          규제를 받는 금융 서비스가 아닙니다.{'\n\n'}
          서비스 내 AI 코치의 제안은 참고용이며, 최종 결정은 사용자에게
          있습니다. AI의 제안은 투자, 대출, 금융 상품 추천이 아닙니다.
          {'\n\n'}
          계정 탈퇴 시 3단계 이내에 완료할 수 있으며, 탈퇴 후 30일 이내에
          모든 데이터가 삭제됩니다.
        </Text>

        <Text style={styles.title}>개인정보처리방침</Text>
        <Text style={styles.body}>
          수집 항목: 이메일, 이름, 소비 기록, 계획 데이터{'\n'}
          수집 목적: 서비스 제공 및 개인화{'\n'}
          보유 기간: 탈퇴 후 30일{'\n\n'}
          만 14세 미만의 경우 법정대리인 동의가 필요합니다.
          아동용 개인정보처리방침은 별도 화면에서 확인할 수 있습니다.{'\n\n'}
          광고 SDK는 탑재되어 있지 않습니다. 수집 데이터는 제3자에게
          판매되지 않습니다.
        </Text>

        {/* 개인정보처리방침 전문 외부 링크 */}
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => openUrl(PRIVACY_POLICY_URL)}
          activeOpacity={0.7}
        >
          <Text style={styles.linkText}>개인정보처리방침 전문 보기 →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => openUrl(TERMS_OF_SERVICE_URL)}
          activeOpacity={0.7}
        >
          <Text style={styles.linkText}>이용약관 전문 보기 →</Text>
        </TouchableOpacity>

        <Text style={styles.title}>AI 면책</Text>
        <View style={styles.aiDisclaimer}>
          <Text style={styles.aiDisclaimerText}>
            AI 코치의 제안은 참고용이며 최종 결정은 사용자에게 있습니다.
            Mily AI는 금융 상품을 추천하지 않으며, 판단이나 점수를 부여하지
            않습니다.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title={t('common_confirm')} onPress={() => router.back()} />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, paddingTop: theme.spacing[6] },
  disclaimer: {
    backgroundColor: '#FEF9F0',
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.warning,
    marginBottom: theme.spacing[6],
  },
  disclaimerText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[2],
  },
  disclaimerSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[3],
    marginTop: theme.spacing[4],
  },
  body: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing[4],
  },
  aiDisclaimer: {
    backgroundColor: '#F0F4FA',
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[6],
  },
  aiDisclaimerText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  footer: { paddingVertical: theme.spacing[4] },
  linkButton: {
    paddingVertical: theme.spacing[3],
    marginBottom: theme.spacing[2],
  },
  linkText: {
    fontSize: 14,
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
});
