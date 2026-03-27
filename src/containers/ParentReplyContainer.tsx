// ParentReplyContainer.tsx — 부모 요청 응답 컨테이너
import React from 'react';
import { Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRequestCardFlow } from '../hooks/useRequestCardFlow';
import { ParentReplyScreen } from '../screens/request/ParentReplyScreen';
import { useRequestCardStore } from '../engines/requestCard/requestCardStore';

export function ParentReplyContainer() {
  const router = useRouter();
  const params = useLocalSearchParams<{ cardId: string }>();
  const { accept, decline } = useRequestCardFlow();
  const cards = useRequestCardStore((s) => s.cards);

  const card = cards.find((c: any) => c.id === params.cardId);

  if (!card) {
    router.back();
    return null;
  }

  const handleAccept = async () => {
    const success = await accept(card.id);
    if (success) {
      Alert.alert('수락 완료', '응답을 보냈어요');
      router.back();
    }
  };

  const handleDecline = async (reason: string) => {
    const success = await decline(card.id, reason);
    if (success) {
      Alert.alert('반려 완료', '응답을 보냈어요');
      router.back();
    }
  };

  return (
    <ParentReplyScreen
      requestType={card.type ?? '요청'}
      requestAmount={card.amount}
      aiBufferedContent={card.bufferedText ?? card.reason ?? ''}
      onAccept={handleAccept}
      onCounter={() => router.push({ pathname: '/(adult)/counter-proposal' as any, params: { cardId: card.id, amount: card.amount } })}
      onDecline={handleDecline}
      onBack={() => router.back()}
    />
  );
}
