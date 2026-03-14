import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { RequestCard } from '../../engines/requestCard/requestCardStore';

interface RequestCardViewProps {
  card: RequestCard;
  isParentView?: boolean;
  onCheer?: () => void;
  onHold?: () => void;
  onAdjust?: () => void;
}

export function RequestCardView({
  card,
  isParentView = false,
  onCheer,
  onHold,
  onAdjust,
}: RequestCardViewProps) {
  const { t } = useTranslation();

  const statusLabel: Record<string, string> = {
    pending: '대기 중',
    cheered: t('parent_response_cheer'),
    held: t('parent_response_hold'),
    adjusting: t('parent_response_adjust'),
  };

  return (
    <View style={styles.card}>
      <Text style={styles.message}>{card.bufferedText}</Text>

      {card.status !== 'pending' && (
        <Text style={styles.status}>{statusLabel[card.status]}</Text>
      )}

      {isParentView && card.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, styles.btnCheer]}
            onPress={onCheer}
          >
            <Text style={styles.btnText}>👍 {t('parent_response_cheer')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnHold]}
            onPress={onHold}
          >
            <Text style={styles.btnText}>⏸️ {t('parent_response_hold')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnAdjust]}
            onPress={onAdjust}
          >
            <Text style={styles.btnText}>
              🔄 {t('parent_response_adjust')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing[3],
  },
  message: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    marginBottom: theme.spacing[3],
  },
  status: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing[2],
    flexWrap: 'wrap',
  },
  btn: {
    flex: 1,
    minHeight: 44,
    borderRadius: theme.borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[2],
  },
  btnCheer: {
    backgroundColor: '#EDF6ED',
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  btnHold: {
    backgroundColor: '#FEF9F0',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  btnAdjust: {
    backgroundColor: '#EDF2F9',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  btnText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
});
