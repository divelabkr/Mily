// app/(child)/dream.tsx
import React from 'react';
import { useAuthStore } from '../../src/engines/auth/authStore';
import { DreamStudioScreen } from '../../src/screens/dream/DreamStudioScreen';

export default function ChildDreamRoute() {
  const user = useAuthStore((s) => s.user);
  const ageBand = user?.ageBand ?? 'B';
  return <DreamStudioScreen ageBand={ageBand} audience="child" />;
}
