import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getFirebaseDb, getFirebaseFunctions } from '../../lib/firebase';
import {
  RequestCard,
  RequestStatus,
  RequestType,
  useRequestCardStore,
} from './requestCardStore';

// RequestCardType alias — backwards compat for containers importing this name
export type { RequestType as RequestCardType } from './requestCardStore';
import { notifyRequestCardReceived } from '../notification/notificationService';
import { capture } from '../monitoring/posthogService';

const COOLDOWN_DAYS = 7;

// ──────────────────────────────────────────────
// 요청 카드 생성 (자녀 → 부모)
// ──────────────────────────────────────────────

export async function sendRequestCard(
  familyId: string,
  fromUid: string,
  toUid: string,
  originalText: string,
  requestType: RequestType,
  senderName?: string
): Promise<RequestCard> {
  // AI 완충 — Firebase Functions callable (API 키 서버 보호)
  let bufferedText = originalText;
  try {
    const bufferFn = httpsCallable<
      { originalText: string; requestType: RequestType },
      { bufferedText: string }
    >(getFirebaseFunctions(), 'bufferRequestCard');
    const res = await bufferFn({ originalText, requestType });
    bufferedText = res.data.bufferedText || originalText;
  } catch {
    // fallback: 원문 그대로
  }

  const colRef = collection(getFirebaseDb(), 'request_cards', familyId);
  const docRef = await addDoc(colRef, {
    familyId,
    fromUid,
    toUid,
    originalText,
    bufferedText,
    requestType,
    status: 'pending' as RequestStatus,
    createdAt: serverTimestamp(),
    cooldownUntil:
      Date.now() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000,
  });

  const card: RequestCard = {
    id: docRef.id,
    familyId,
    fromUid,
    toUid,
    originalText,
    bufferedText,
    requestType,
    status: 'pending',
    createdAt: Date.now(),
    cooldownUntil: Date.now() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000,
  };

  useRequestCardStore.getState().addCard(card);
  capture('request_card_sent', { requestType });

  // urgent: 즉시 부모 푸시 알림
  if (requestType === 'urgent') {
    await notifyRequestCardReceived(senderName ?? '자녀');
  }

  return card;
}

// ──────────────────────────────────────────────
// 부모 응답 (3버튼)
// ──────────────────────────────────────────────

export async function respondToCard(
  familyId: string,
  cardId: string,
  status: 'cheered' | 'held' | 'adjusting'
): Promise<void> {
  const cardRef = doc(getFirebaseDb(), 'request_cards', familyId, cardId);
  await updateDoc(cardRef, {
    status,
    respondedAt: serverTimestamp(),
  });
  useRequestCardStore
    .getState()
    .updateCard(cardId, { status, respondedAt: Date.now() });
}

// ──────────────────────────────────────────────
// 카드 목록 로드
// ──────────────────────────────────────────────

export async function loadRequestCards(familyId: string): Promise<RequestCard[]> {
  const colRef = collection(getFirebaseDb(), 'request_cards', familyId);
  const q = query(colRef, orderBy('createdAt', 'desc'));
  const snaps = await getDocs(q);

  const cards: RequestCard[] = snaps.docs.map((d) => ({
    ...(d.data() as Omit<RequestCard, 'id'>),
    id: d.id,
    createdAt:
      (d.data().createdAt?.seconds ?? 0) * 1000 || Date.now(),
  }));

  useRequestCardStore.getState().setCards(cards);
  return cards;
}

