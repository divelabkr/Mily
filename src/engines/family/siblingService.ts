// ──────────────────────────────────────────────
// siblingService.ts — 형제자매 개별 관리
// 공정성 비교 없음 (DNA 원칙)
// 각자 독립 대시보드. 경쟁/순위 금지.
// ──────────────────────────────────────────────

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';

// ── 타입 ──────────────────────────────────────

export interface SiblingProfile {
  uid: string;
  familyId: string;
  displayName: string;
  ageBand: 'child_young' | 'child_mid' | 'teen' | 'young_adult';
  weeklyBudget: number;
  // 개인 요약 (비교 없음)
  thisWeekSpent: number;
  thisWeekCheckins: number;
  streak: number; // 연속 기록 주
}

export interface SiblingDashboardData {
  siblings: SiblingProfile[];
  // 공유 정보: 각자 뭘 했는지만 (수치 비교 없음, DNA)
  familyWeeklyPromise?: string;
}

// ── 조회 ──────────────────────────────────────

/**
 * 가족 내 자녀 프로필 목록 조회.
 * 순위/비교 없음. 각자 독립 데이터만.
 */
export async function getSiblingProfiles(familyId: string): Promise<SiblingProfile[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, 'family_members'),
    where('familyId', '==', familyId),
    where('role', '==', 'child')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as SiblingProfile);
}

/**
 * 특정 자녀 프로필 조회.
 */
export async function getSiblingProfile(uid: string): Promise<SiblingProfile | null> {
  const db = getFirebaseDb();
  const ref = doc(db, 'family_members', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as SiblingProfile) : null;
}

/**
 * 형제자매 대시보드 데이터 조합.
 * 비교 지표 없음. 각자 이번 주 활동만.
 */
export async function getSiblingDashboard(familyId: string): Promise<SiblingDashboardData> {
  const siblings = await getSiblingProfiles(familyId);
  return { siblings };
}
