// CheckinContainer.tsx — 체크인 컨테이너 (서비스 연결)
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useCheckinSubmit } from '../hooks/useCheckinSubmit';
import { UnifiedCheckinScreen } from '../screens/checkin/UnifiedCheckinScreen';

export function CheckinContainer() {
  const router = useRouter();
  const { isSubmitting, error, submit } = useCheckinSubmit();

  const handleSubmit = async (input: any) => {
    const success = await submit(input);
    if (success) {
      router.back();
    } else if (error) {
      Alert.alert('기록 실패', error);
    }
  };

  return (
    <UnifiedCheckinScreen
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
      isSubmitting={isSubmitting}
    />
  );
}
