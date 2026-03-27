// app/(child)/simulator.tsx
import React from 'react';
import { useRouter } from 'expo-router';
import { GoalSimulatorScreen } from '../../src/screens/simulator/GoalSimulatorScreen';

export default function ChildSimulatorRoute() {
  const router = useRouter();
  return (
    <GoalSimulatorScreen
      onSendRequest={(goalTitle, amount) => {
        router.push({ pathname: '/(child)/request' as any, params: { goalTitle, amount } });
      }}
      onClose={() => router.back()}
    />
  );
}
