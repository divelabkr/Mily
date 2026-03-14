import { create } from 'zustand';
import {
  collection,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import { trackEvent } from '../analytics/analyticsService';
import { BadgeId, BadgeContext, EconomicBadge, UserBadge } from './badgeTypes';

// ──────────────────────────────────────────────
// 9종 뱃지 정의
// CLAUDE.md §20: 수집이지 점수 아님
// ──────────────────────────────────────────────

export const ECONOMIC_BADGES: EconomicBadge[] = [
  {
    id: 'budget',
    label: '예산',
    description: '쓸 수 있는 돈의 한계를 미리 정하는 것.',
    emoji: '💰',
    triggerHint: '첫 월 예산을 설정하면 얻을 수 있어요.',
  },
  {
    id: 'plan',
    label: '계획',
    description: '돈을 어디에 쓸지 미리 나눠두는 것.',
    emoji: '📋',
    triggerHint: '첫 월 계획을 만들면 얻을 수 있어요.',
  },
  {
    id: 'review',
    label: '회고',
    description: '이번 주 소비를 돌아보고 다음을 준비하는 것.',
    emoji: '🔍',
    triggerHint: '첫 주간 회고를 완료하면 얻을 수 있어요.',
  },
  {
    id: 'fixed_cost',
    label: '고정비',
    description: '매달 반복되는 정해진 지출.',
    emoji: '🔒',
    triggerHint: '고정비 카테고리로 체크인하면 얻을 수 있어요.',
  },
  {
    id: 'negotiate',
    label: '협상',
    description: '서로 다른 생각을 조율해 더 나은 결과를 만드는 것.',
    emoji: '🤝',
    triggerHint: '요청 카드에서 조정 응답을 경험하면 얻을 수 있어요.',
  },
  {
    id: 'emergency',
    label: '비상금',
    description: '예상치 못한 지출에 대비해 따로 두는 돈.',
    emoji: '🚨',
    triggerHint: '긴급 요청 카드를 보내면 얻을 수 있어요.',
  },
  {
    id: 'promise',
    label: '약속',
    description: '이번 주 내가 지키겠다고 스스로와 한 다짐.',
    emoji: '🤙',
    triggerHint: '이번 주 약속을 처음 설정하면 얻을 수 있어요.',
  },
  {
    id: 'consensus',
    label: '합의',
    description: '서로의 의견을 존중해 함께 결정에 도달하는 것.',
    emoji: '✅',
    triggerHint: '요청 카드에서 응원 응답을 경험하면 얻을 수 있어요.',
  },
  {
    id: 'independence',
    label: '독립',
    description: '스스로 계획하고 스스로 결정하는 경제 자립.',
    emoji: '🦋',
    triggerHint: '4주 연속 혼자 기록을 이어가면 얻을 수 있어요.',
  },
];

export function findBadge(id: BadgeId): EconomicBadge {
  return ECONOMIC_BADGES.find((b) => b.id === id)!;
}

// ──────────────────────────────────────────────
// Zustand 스토어
// ──────────────────────────────────────────────

interface BadgeState {
  userBadges: UserBadge[];
  loading: boolean;
  setUserBadges: (list: UserBadge[]) => void;
  addBadge: (badge: UserBadge) => void;
  setLoading: (v: boolean) => void;
  hasBadge: (id: BadgeId) => boolean;
}

export const useBadgeStore = create<BadgeState>((set, get) => ({
  userBadges: [],
  loading: false,
  setUserBadges: (list) => set({ userBadges: list }),
  addBadge: (badge) =>
    set((state) => ({ userBadges: [...state.userBadges, badge] })),
  setLoading: (v) => set({ loading: v }),
  hasBadge: (id) => get().userBadges.some((b) => b.badgeId === id),
}));

// ──────────────────────────────────────────────
// 조건 정의 — 해당 기능 첫 사용 시 자동 부여
// ──────────────────────────────────────────────

const BADGE_CONDITIONS: Record<BadgeId, (ctx: BadgeContext) => boolean> = {
  budget:       (ctx) => ctx.totalBudgetSet,
  plan:         (ctx) => ctx.planCount >= 1,
  review:       (ctx) => ctx.reviewCount >= 1,
  fixed_cost:   (ctx) => ctx.hasFixedCheckIn,
  negotiate:    (ctx) => ctx.hasNegotiatedCard,
  emergency:    (ctx) => ctx.hasUrgentRequest,
  promise:      (ctx) => ctx.hasWeeklyPromise,
  consensus:    (ctx) => ctx.hasCheeredResponse,
  independence: (ctx) => ctx.consecutiveWeeks >= 4 && !ctx.familyLinked,
};

// ──────────────────────────────────────────────
// Firestore CRUD
// ──────────────────────────────────────────────

// economic_badges/{uid}/{badgeId}
export async function loadUserBadges(uid: string): Promise<UserBadge[]> {
  const colRef = collection(getFirebaseDb(), 'economic_badges', uid);
  const snaps = await getDocs(colRef);
  const list = snaps.docs.map((d) => d.data() as UserBadge);
  useBadgeStore.getState().setUserBadges(list);
  return list;
}

async function saveBadge(uid: string, badge: UserBadge): Promise<void> {
  const ref = doc(getFirebaseDb(), 'economic_badges', uid, badge.badgeId);
  await setDoc(ref, badge);
}

// ──────────────────────────────────────────────
// 핵심: 조건 체크 + 뱃지 부여
// ──────────────────────────────────────────────

/**
 * 컨텍스트 기준으로 새로 획득된 뱃지 목록 반환.
 * 이미 획득한 뱃지는 건너뜀.
 */
export async function checkAndAwardBadges(
  uid: string,
  ctx: BadgeContext
): Promise<EconomicBadge[]> {
  const alreadyEarned = new Set<BadgeId>(ctx.earnedBadges);
  const newBadges: EconomicBadge[] = [];

  for (const badge of ECONOMIC_BADGES) {
    if (alreadyEarned.has(badge.id)) continue;
    if (!BADGE_CONDITIONS[badge.id](ctx)) continue;

    const userBadge: UserBadge = {
      badgeId: badge.id,
      earnedAt: Date.now(),
    };
    await saveBadge(uid, userBadge);
    useBadgeStore.getState().addBadge(userBadge);
    newBadges.push(badge);

    await trackEvent('badge_earned', { id: badge.id });
  }

  return newBadges;
}

/**
 * 단일 트리거 포인트에서 즉시 뱃지 체크.
 * 예: plan 저장 직후 checkSingleBadge(uid, 'plan', ctx)
 */
export async function checkSingleBadge(
  uid: string,
  badgeId: BadgeId,
  ctx: BadgeContext
): Promise<boolean> {
  if (useBadgeStore.getState().hasBadge(badgeId)) return false;
  if (!BADGE_CONDITIONS[badgeId](ctx)) return false;

  const userBadge: UserBadge = { badgeId, earnedAt: Date.now() };
  await saveBadge(uid, userBadge);
  useBadgeStore.getState().addBadge(userBadge);
  await trackEvent('badge_earned', { id: badgeId });
  return true;
}
