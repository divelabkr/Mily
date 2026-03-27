// app/(adult)/dream.tsx
import React from 'react';
import { useAuthStore } from '../../src/engines/auth/authStore';
import { DreamStudioScreen } from '../../src/screens/dream/DreamStudioScreen';

export default function DreamRoute() {
  const user = useAuthStore((s) => s.user);
  return <DreamStudioScreen ageBand="D" audience="parent" />;
}
