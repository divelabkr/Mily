// app/(adult)/cashflow.tsx
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAuthStore } from '../../src/engines/auth/authStore';
import { calculateCashFlowFromData, CashFlowData, OutflowItem } from '../../src/engines/cashflow/cashFlowEngine';
import { useCheckInStore } from '../../src/engines/checkin/checkinStore';
import { CashFlowScreen } from '../../src/screens/cashflow/CashFlowScreen';
import { SkeletonList } from '../../src/components/ui/SkeletonCard';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { getWeekId } from '../../src/utils/dateUtils';

export default function CashflowRoute() {
  const user = useAuthStore((s) => s.user);
  const weeklyCheckIns = useCheckInStore((s) => s.weeklyCheckIns);
  const [data, setData] = useState<CashFlowData | null>(null);

  useEffect(() => {
    if (weeklyCheckIns.length > 0 && user?.uid) {
      const outflows: OutflowItem[] = weeklyCheckIns.map((c) => ({
        categoryId: c.categoryId,
        spendType: c.spendType ?? 'choice',
        amount: c.amount,
        assetType: 'consumable' as const,
      }));
      const result = calculateCashFlowFromData(user.uid, getWeekId(), [], outflows);
      setData(result);
    }
  }, [weeklyCheckIns, user?.uid]);

  if (!data) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
        <EmptyState context="home" actionLabel="기록하러 가기" />
      </View>
    );
  }

  return <CashFlowScreen data={data} />;
}
