import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import {
  PraiseCard,
  PraiseCardType,
  usePraiseCardStore,
} from './praiseCardStore';

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
