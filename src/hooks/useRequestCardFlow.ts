// useRequestCardFlow.ts — 요청카드 플로우 훅
import { useState, useCallback } from 'react';
import { useAuthStore } from '../engines/auth/authStore';
import { sendRequestCard, respondToCard, loadRequestCards } from '../engines/requestCard/requestCardService';
import { useRequestCardStore } from '../engines/requestCard/requestCardStore';
import type { RequestCardType } from '../engines/requestCard/requestCardService';

interface RequestCardFlowHook {
  isSubmitting: boolean;
  error: string | null;
  cards: any[];
  loading: boolean;
  send: (type: RequestCardType, amount: number, reason: string) => Promise<boolean>;
  accept: (cardId: string) => Promise<boolean>;
  decline: (cardId: string, reason: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useRequestCardFlow(): RequestCardFlowHook {
  const user = useAuthStore((s) => s.user);
  const cards = useRequestCardStore((s) => s.cards);
  const loading = useRequestCardStore((s) => s.loading);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (type: RequestCardType, amount: number, reason: string): Promise<boolean> => {
    if (!user?.uid || !user?.familyId) {
      setError('가족 연결이 필요해요');
      return false;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await sendRequestCard({
        uid: user.uid,
        familyId: user.familyId,
        type,
        amount,
        reason,
      });
      return true;
    } catch (e: any) {
      setError(e?.message ?? '요청 카드 발송에 실패했어요');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.uid, user?.familyId]);

  const accept = useCallback(async (cardId: string): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      await respondToCard(cardId, 'approved');
      return true;
    } catch (e: any) {
      setError(e?.message ?? '응답 처리에 실패했어요');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const decline = useCallback(async (cardId: string, reason: string): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      await respondToCard(cardId, 'declined', reason);
      return true;
    } catch (e: any) {
      setError(e?.message ?? '응답 처리에 실패했어요');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!user?.familyId) return;
    try {
      await loadRequestCards(user.familyId);
    } catch {}
  }, [user?.familyId]);

  return { isSubmitting, error, cards, loading, send, accept, decline, refresh };
}
