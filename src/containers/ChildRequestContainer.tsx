// ChildRequestContainer.tsx — 자녀 요청카드 컨테이너
import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useRequestCardFlow } from '../hooks/useRequestCardFlow';
import { ChildRequestScreen } from '../screens/request/ChildRequestScreen';
import { getRequestCardBuffer } from '../engines/message/messageService';
import { useAuthStore } from '../engines/auth/authStore';
import type { RequestCardType } from '../engines/requestCard/requestCardService';

export function ChildRequestContainer() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { isSubmitting, error, send } = useRequestCardFlow();
  const [aiPreview, setAiPreview] = useState<string | undefined>();

  const handleSubmit = async (type: RequestCardType, amount: number, reason: string) => {
    const success = await send(type, amount, reason);
    if (success) {
      Alert.alert('요청 완료', '카드를 보냈어요!');
      router.back();
    } else if (error) {
      Alert.alert('발송 실패', error);
    }
  };

  return (
    <ChildRequestScreen
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
      aiBufferPreview={aiPreview}
      isSubmitting={isSubmitting}
    />
  );
}
