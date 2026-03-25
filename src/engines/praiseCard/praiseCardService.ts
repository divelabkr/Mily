import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import {
  PraiseCard,
  PraiseCardType,
  usePraiseCardStore,
} from './praiseCardStore';
import { checkTrigger } from '../achievement/achievementService';
import { getPraiseRecommendation } from '../message/messageService';
import type { PraiseSituation } from '../message/messageService';

// Firestore 경로: praise_cards/{familyId}/{cardId}

export async function sendPraiseCard(
  familyId: string,
  fromUid: string,
  toUid: string,
  type: PraiseCardType
): Promise<PraiseCard> {
  const colRef = collection(getFirebaseDb(), 'praise_cards', familyId);
  const docRef = await addDoc(colRef, {
    familyId,
    fromUid,
    toUid,
    type,
    createdAt: serverTimestamp(),
  });

  const card: PraiseCard = {
    cardId: docRef.id,
    familyId,
    fromUid,
    toUid,
    type,
    createdAt: Date.now(),
  };

  usePraiseCardStore.getState().addCard(card);
  return card;
}

/**
 * 자녀가 칭찬 카드를 확인했을 때 호출.
 * Firestore에 seenAt 기록 + 업적 트리거.
 */
export async function seenPraiseCard(
  uid: string,
  familyId: string,
  cardId: string
): Promise<void> {
  const ref = doc(getFirebaseDb(), 'praise_cards', familyId, cardId);
  await updateDoc(ref, { seenAt: serverTimestamp() });
  await checkTrigger('praise_received', uid, { praiseCardsSent: 0 });
}

/**
 * 상황별 칭찬 카드 추천 문구 반환 (messageService 위임).
 */
export function recommendPraiseCard(situation: PraiseSituation) {
  return getPraiseRecommendation(situation);
}

export async function loadPraiseCards(familyId: string): Promise<PraiseCard[]> {
  const colRef = collection(getFirebaseDb(), 'praise_cards', familyId);
  const q = query(colRef, orderBy('createdAt', 'desc'));
  const snaps = await getDocs(q);

  const cards: PraiseCard[] = snaps.docs.map((d) => ({
    ...(d.data() as Omit<PraiseCard, 'cardId'>),
    cardId: d.id,
    createdAt: (d.data().createdAt?.seconds ?? 0) * 1000 || Date.now(),
  }));

  usePraiseCardStore.getState().setCards(cards);
  return cards;
}
