// app/(adult)/cashflow.tsx
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAuthStore } from '../../src/engines/auth/authStore';
import { calculateCashFlowFromData, CashFlowData } from '../../src/engines/cashflow/cashFlowEngine';
import { useCheckInStore } from '../../src/engines/checkin/checkinStore';
import { CashFlowScreen } from '../../src/screens/cashflow/CashFlowScreen';
import { SkeletonList } from '../../src/components/ui/SkeletonCard';
import { EmptyState } from '../../src/components/ui/EmptyState';

export default function CashflowRoute() {
  const user = useAuthStore((s) => s.user);
  const weeklyCheckIns = useCheckInStore((s) => s.weeklyCheckIns);
  const [data, setData] = useState<CashFlowData | null>(null);

  useEffect(() => {
    if (weeklyCheckIns.length > 0) {
      const result = calculateCashFlowFromData(weeklyCheckIns, []);
      setData(result);
    }
  }, [weeklyCheckIns]);

  if (!data) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
        <EmptyState context="home" actionLabel="기록하러 가기" />
      </View>
    );
  }

  return <CashFlowScreen data={data} />;
}
