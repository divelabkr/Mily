import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';

interface BoundarySheetProps {
  visible: boolean;
  categoryLabel: string;
  onException: () => void;   // 예외로 남기기
  onAdjust: () => void;      // 다른 카테고리에서 조정
  onDefer: () => void;       // 다음 주 회고에서 다루기
  onClose: () => void;
}

export function BoundarySheet({
  visible,
  categoryLabel,
  onException,
  onAdjust,
  onDefer,
  onClose,
}: BoundarySheetProps) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <Text style={styles.title}>{t('boundary_outside_title')}</Text>
        <Text style={styles.subtitle}>
          {t('boundary_similar', { category: categoryLabel })}
        </Text>

        <TouchableOpacity
          style={styles.option}
          onPress={onException}
          activeOpacity={0.8}
        >
          <Text style={styles.optionText}>{t('boundary_outside_opt1')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={onAdjust}
          activeOpacity={0.8}
        >
          <Text style={styles.optionText}>{t('boundary_outside_opt2')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, styles.optionLast]}
          onPress={onDefer}
          activeOpacity={0.8}
        >
          <Text style={styles.optionText}>{t('boundary_outside_opt3')}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: theme.spacing[5],
    paddingBottom: 40,
    paddingTop: theme.spacing[3],
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: theme.spacing[5],
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing[5],
  },
  option: {
    minHeight: 52,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  optionLast: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing[3],
  },
});
