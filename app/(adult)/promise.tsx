// app/(adult)/promise.tsx
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAuthStore } from '../../src/engines/auth/authStore';
import { getActiveContracts, FamilyContract } from '../../src/engines/familyBank/familyBankService';
import { getScore, TrustLevel } from '../../src/engines/familyBank/trustScoreService';
import { FamilyPromiseScreen } from '../../src/screens/promise/FamilyPromiseScreen';
import { SkeletonList } from '../../src/components/ui/SkeletonCard';
import { ErrorCard } from '../../src/components/ui/ErrorCard';

export default function PromiseRoute() {
  const user = useAuthStore((s) => s.user);
  const [contracts, setContracts] = useState<FamilyContract[]>([]);
  const [trustLevel, setTrustLevel] = useState<TrustLevel>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!user?.familyId || !user?.uid) return;
      setLoading(true);
      try {
        const [c, score] = await Promise.all([
          getActiveContracts(user.familyId),
          getScore(user.uid),
        ]);
        setContracts(c);
        setTrustLevel(score.level);
      } catch (e: any) {
        setError(e?.message ?? '약속 기록을 불러오지 못했어요');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.familyId, user?.uid]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF7F2', padding: 16, paddingTop: 60 }}>
        <SkeletonList count={3} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF7F2', justifyContent: 'center', padding: 24 }}>
        <ErrorCard message={error} />
      </View>
    );
  }

  return <FamilyPromiseScreen contracts={contracts} trustLevel={trustLevel} />;
}
