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
import { getFirebaseDb } from '../../lib/firebase';
import {
  RequestCard,
  RequestStatus,
  RequestType,
  useRequestCardStore,
} from './requestCardStore';
import { bufferRequestText } from '../ai/aiToneService';
import { notifyRequestCardReceived } from '../notification/notificationService';

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
  // AI 완충
  const { bufferedText } = await bufferRequestText({ originalText, requestType });

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

// ──────────────────────────────────────────────
// DAE 래핑 버전 (신규 화면에서 이걸 쓰면 됨)
// 기존 함수는 절대 수정 안 함
// ──────────────────────────────────────────────

import { sendCardSkill } from '../../dae/skills/mily.request.send-card';

export async function sendRequestCardViaDAE(
  input: {
    familyId: string;
    fromUid: string;
    toUid: string;
    originalText: string;
    requestType: RequestType;
    senderName?: string;
  },
  callerId: string
): Promise<RequestCard> {
  const result = await sendCardSkill(
    input,
    { id: callerId, role: 'child' },
    'request_card_send'
  );

  if (!result.success) {
    console.warn(`[DAE] sendRequestCard blocked at ${result.gateId}: ${result.reason}`);
    throw new Error(result.reason);
  }

  return result.output as RequestCard;
}
