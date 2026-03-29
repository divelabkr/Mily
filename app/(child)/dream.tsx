// app/(child)/dream.tsx
import React from 'react';
import { useAuthStore } from '../../src/engines/auth/authStore';
import { DreamStudioScreen } from '../../src/screens/dream/DreamStudioScreen';
import type { AgeBand } from '../../src/engines/message/milyPersona';

export default function ChildDreamRoute() {
  const user = useAuthStore((s) => s.user);
  const ageBand = (user?.ageBand ?? 'B') as AgeBand;
  return <DreamStudioScreen ageBand={ageBand} audience="child" />;
}
