import {
  collection,
  doc,
  getDocs,
  setDoc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import { trackEvent } from '../analytics/analyticsService';
import {
  AchievementContext,
  UserAchievement,
  AchievementStats,
  Achievement,
} from './achievementTypes';
import { ACHIEVEMENTS } from './achievementDefinitions';
import { useAchievementStore } from './achievementStore';

// ──────────────────────────────────────────────
// Firestore CRUD
// ──────────────────────────────────────────────

// achievements/{uid}/{achievementId}
export async function loadUserAchievements(uid: string): Promise<UserAchievement[]> {
  const colRef = collection(getFirebaseDb(), 'achievements', uid);
  const snaps = await getDocs(colRef);
  const list: UserAchievement[] = snaps.docs.map((d) => d.data() as UserAchievement);
  useAchievementStore.getState().setUserAchievements(list);
  return list;
}

async function saveUserAchievement(uid: string, ua: UserAchievement): Promise<void> {
  const ref = doc(getFirebaseDb(), 'achievements', uid, ua.achievementId);
  await setDoc(ref, ua);
}

// achievement_stats/{achievementId}
export async function loadAchievementStats(ids: string[]): Promise<AchievementStats[]> {
  const stats: AchievementStats[] = [];
  for (const id of ids) {
    const ref = doc(getFirebaseDb(), 'achievement_stats', id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      stats.push(snap.data() as AchievementStats);
    }
  }
  useAchievementStore.getState().setStats(stats);
  return stats;
}

// ──────────────────────────────────────────────
// 핵심: 조건 체크 + 해금
// ──────────────────────────────────────────────

/**
 * 현재 컨텍스트 기준으로 새로 해금된 업적 목록을 반환.
 * 이미 해금된 업적은 건너뜀.
 * 첫 번째 해금 업적을 pendingUnlock에 등록 (팝업용).
 */
export async function checkAndUnlock(
  uid: string,
  ctx: AchievementContext
): Promise<Achievement[]> {
  const store = useAchievementStore.getState();
  const alreadyUnlocked = new Set(ctx.unlockedAchievements);

  const newlyUnlocked: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (alreadyUnlocked.has(achievement.id)) continue;
    if (!achievement.condition(ctx)) continue;

    const ua: UserAchievement = {
      achievementId: achievement.id,
      unlockedAt: Date.now(),
      shared: false,
    };

    await saveUserAchievement(uid, ua);
    store.addUnlocked(ua);
    newlyUnlocked.push(achievement);

    // Amplitude 이벤트
    const stats = store.statsMap[achievement.id];
    await trackEvent('achievement_unlocked', {
      id: achievement.id,
      rarity: achievement.rarity,
      unlockRate: stats?.unlockRate ?? null,
    });
  }

  // 첫 번째 해금 업적을 팝업 대기열에 등록
  if (newlyUnlocked.length > 0) {
    store.setPendingUnlock(newlyUnlocked[0]);
  }

  return newlyUnlocked;
}

// ──────────────────────────────────────────────
// 가족 업적 조회 (가족 탭용)
// ──────────────────────────────────────────────

/**
 * 여러 멤버의 UserAchievement 목록을 한 번에 로드.
 * shared=true인 업적만 반환 (역전된 프라이버시).
 */
export async function loadFamilyAchievements(
  memberUids: string[]
): Promise<Record<string, UserAchievement[]>> {
  const result: Record<string, UserAchievement[]> = {};
  for (const uid of memberUids) {
    const colRef = collection(getFirebaseDb(), 'achievements', uid);
    const snaps = await getDocs(colRef);
    result[uid] = snaps.docs
      .map((d) => d.data() as UserAchievement)
      .filter((ua) => ua.shared);
  }
  return result;
}

/**
 * 업적 공유 상태 토글 (해금 팝업 "공유하기" 버튼에서 호출).
 */
export async function markAchievementShared(
  uid: string,
  achievementId: string,
  shared: boolean
): Promise<void> {
  const ref = doc(getFirebaseDb(), 'achievements', uid, achievementId);
  await updateDoc(ref, { shared });
  useAchievementStore.getState().updateShared(achievementId, shared);
}

// ──────────────────────────────────────────────
// 통계 표시용
// ──────────────────────────────────────────────

/**
 * 유저 1,000명 이상일 때만 실제 비율 반환.
 * 미만이면 null 반환 → UI에서 "???" 처리.
 */
export function getUnlockRateLabel(
  achievementId: string,
  totalUsers: number
): string | null {
  if (totalUsers < 1000) return null;
  const stats = useAchievementStore.getState().statsMap[achievementId];
  if (!stats) return null;
  const pct = (stats.unlockRate * 100).toFixed(1);
  return `${pct}%의 밀리 사용자가 발견했어요`;
}

// ──────────────────────────────────────────────
// 홈 "거의 다 왔어요" 카드용
// ──────────────────────────────────────────────

/**
 * 아직 해금되지 않은 업적 중 가장 조건에 가까운 1개 반환.
 * 히든 업적은 제외.
 */
export function getNearestAchievement(
  ctx: AchievementContext
): Achievement | null {
  const unlocked = new Set(ctx.unlockedAchievements);
  const candidates = ACHIEVEMENTS.filter(
    (a) => !unlocked.has(a.id) && !a.isHidden
  );

  // count-based 조건만 간단 휴리스틱으로 진행도 추정
  // (실제 진행도 계산은 각 조건 함수 내부 데이터 기반)
  for (const a of candidates) {
    // condition에 거의 도달한 업적 = condition이 false지만 거의 true인 것
    // MVP에서는 단순히 첫 번째 미해금 비히든 업적 반환
    if (!a.condition(ctx)) return a;
  }

  return null;
}
