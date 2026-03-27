// app/(child)/promise.tsx
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAuthStore } from '../../src/engines/auth/authStore';
import { getActiveContracts, FamilyContract } from '../../src/engines/familyBank/familyBankService';
import { getScore, TrustLevel } from '../../src/engines/familyBank/trustScoreService';
import { FamilyPromiseScreen } from '../../src/screens/promise/FamilyPromiseScreen';
import { SkeletonList } from '../../src/components/ui/SkeletonCard';

export default function ChildPromiseRoute() {
  const user = useAuthStore((s) => s.user);
  const [contracts, setContracts] = useState<FamilyContract[]>([]);
  const [trustLevel, setTrustLevel] = useState<TrustLevel>(1);
  const [loading, setLoading] = useState(true);

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
      } catch {} finally {
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

  return <FamilyPromiseScreen contracts={contracts} trustLevel={trustLevel} />;
}
