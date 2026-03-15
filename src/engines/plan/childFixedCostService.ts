// ──────────────────────────────────────────────
// childFixedCostService.ts — 부모가 설정하는 자녀 고정비
// Firestore: families/{familyId}/childFixedCosts
// ──────────────────────────────────────────────

import {
  doc,
  collection,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import { notifyChildFixedCostUpdated } from '../notification/notificationService';
import { capture } from '../monitoring/posthogService';
import type { ChildFixedCost } from './planTypes';

// ──────────────────────────────────────────────
// 고정비 저장 (추가/수정)
// ──────────────────────────────────────────────

export async function saveChildFixedCost(
  familyId: string,
  cost: Omit<ChildFixedCost, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ChildFixedCost> {
  const id = `fc_${cost.childUid}_${Date.now()}`;
  const now = Date.now();
  const record: ChildFixedCost = { ...cost, id, createdAt: now, updatedAt: now };

  await setDoc(
    doc(getFirebaseDb(), 'families', familyId, 'childFixedCosts', id),
    record
  );

  // 자녀에게 FCM 알림
  await notifyChildFixedCostUpdated(
    cost.childUid,
    cost.categoryName,
    cost.amount
  ).catch(() => {});

  capture('parent_fixed_cost_set', { categoryName: cost.categoryName });
  return record;
}

// ──────────────────────────────────────────────
// 자녀의 고정비 목록 조회
// ──────────────────────────────────────────────

export async function getChildFixedCosts(
  familyId: string,
  childUid: string
): Promise<ChildFixedCost[]> {
  const snap = await getDocs(
    query(
      collection(getFirebaseDb(), 'families', familyId, 'childFixedCosts'),
      where('childUid', '==', childUid)
    )
  );

  const costs: ChildFixedCost[] = [];
  snap.forEach((d) => costs.push(d.data() as ChildFixedCost));
  return costs.sort((a, b) => a.createdAt - b.createdAt);
}

// ──────────────────────────────────────────────
// 고정비 삭제
// ──────────────────────────────────────────────

export async function deleteChildFixedCost(
  familyId: string,
  costId: string
): Promise<void> {
  await deleteDoc(
    doc(getFirebaseDb(), 'families', familyId, 'childFixedCosts', costId)
  );
}
