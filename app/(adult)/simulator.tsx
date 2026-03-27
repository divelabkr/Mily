// app/(adult)/simulator.tsx
import React from 'react';
import { useRouter } from 'expo-router';
import { GoalSimulatorScreen } from '../../src/screens/simulator/GoalSimulatorScreen';

export default function SimulatorRoute() {
  const router = useRouter();
  return (
    <GoalSimulatorScreen
      onSendRequest={(goalTitle, amount) => {
        router.push({ pathname: '/(adult)/family' as any, params: { goalTitle, amount } });
      }}
      onClose={() => router.back()}
    />
  );
}
