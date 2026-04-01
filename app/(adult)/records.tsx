import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenLayout } from '../../src/ui/layouts/ScreenLayout';
import { theme } from '../../src/ui/theme';
import { useAuthStore } from '../../src/engines/auth/authStore';
import { useCheckInStore } from '../../src/engines/checkin/checkinStore';
import { loadWeeklyCheckIns } from '../../src/engines/checkin/checkinService';
import { DEFAULT_CATEGORIES } from '../../src/engines/plan/defaultCategories';
import { formatCurrency } from '../../src/utils/formatCurrency';

export default function RecordsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const checkIns = useCheckInStore((s) => s.weeklyCheckIns);

  useEffect(() => {
    if (user) loadWeeklyCheckIns(user.uid);
  }, [user?.uid]);

  const sorted = [...checkIns].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <ScreenLayout>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Text style={styles.backText}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>이번 주 기록</Text>
      </View>

      {sorted.length === 0 ? (
        <View style={styles.emptyArea}>
          <Text style={styles.emptyText}>이번 주 기록이 없어요.{'\n'}오늘 뭘 썼는지 남겨볼까요?</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.checkInId}
          renderItem={({ item }) => {
            const cat = DEFAULT_CATEGORIES.find((c) => c.id === item.categoryId);
            const spendEmoji = item.spendType === 'fixed' ? '🔒' : item.spendType === 'living' ? '🛒' : '✨';
            return (
              <View style={styles.row}>
                <Text style={styles.rowEmoji}>{cat?.emoji ?? '📝'}</Text>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowCat}>{cat?.label ?? item.categoryId}</Text>
                  {item.memo ? (
                    <Text style={styles.rowMemo} numberOfLines={1}>{item.memo}</Text>
                  ) : null}
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowAmount}>{formatCurrency(item.amount)}</Text>
                  <Text style={styles.rowSpendType}>{spendEmoji}</Text>
                </View>
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    paddingRight: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 17,
    color: theme.milyColors.coral,
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.milyColors.brownDark,
  },
  emptyArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: theme.milyColors.brownMid,
    textAlign: 'center',
    lineHeight: 24,
  },
  listContent: {
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowEmoji: {
    fontSize: 22,
    marginRight: 14,
  },
  rowInfo: {
    flex: 1,
  },
  rowCat: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.milyColors.brownDark,
  },
  rowMemo: {
    fontSize: 12,
    color: theme.milyColors.brownMid,
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  rowAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.milyColors.brownDark,
  },
  rowSpendType: {
    fontSize: 13,
  },
  separator: {
    height: 1,
    backgroundColor: theme.milyColors.surface2,
  },
});
