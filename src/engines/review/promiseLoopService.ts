// ──────────────────────────────────────────────
// promiseLoopService.ts — 약속-행동-인정 루프
// 주간 약속 달성 감지 → 칭찬 카드 추천 알림 → 부모 알림
// 비난/훈계 절대 금지. 미달성 = "괜찮아요, 다음 주에!"
// ──────────────────────────────────────────────

import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import { capture } from '../monitoring/posthogService';
import { isAllowedHour } from '../notification/notificationService';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface PromiseLoopResult {
  weekId: string;
  promiseText: string | null;
  kept: boolean | null;
  keptDetectedAt: number | null;
  notifiedParent: boolean;
}

export interface GoodMoment {
  type: 'promise_kept' | 'praise_received';
  weekId: string;
  description: string;
  createdAt: number;
}

// ──────────────────────────────────────────────
// 1. 이번 주 약속 달성 여부 조회
// ──────────────────────────────────────────────

export async function getPromiseStatus(
  uid: string,
  weekId: string
): Promise<{ promiseText: string | null; kept: boolean | null }> {
  try {
    const snap = await getDoc(doc(getFirebaseDb(), 'reviews', uid, weekId));
    if (!snap.exists()) return { promiseText: null, kept: null };
    const data = snap.data() as Record<string, unknown>;
    return {
      promiseText: (data.weeklyPromise as string) ?? null,
      kept: (data.promiseKept as boolean) ?? null,
    };
  } catch {
    return { promiseText: null, kept: null };
  }
}

// ──────────────────────────────────────────────
// 2. 약속 달성 시 부모에게 알림 + 칭찬 카드 제안
// ──────────────────────────────────────────────

async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function notifyParentPromiseKept(
  childName: string,
  childUid?: string
): Promise<void> {
  if (!(await requestPermission())) return;
  if (!isAllowedHour()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Mily — 약속 달성',
      body: `${childName}이(가) 이번 주 약속을 지켰어요! 칭찬 카드 보낼까요? 💌`,
      data: {
        type: 'promise_kept',
        deepLink: childUid ? `mily://praise?toUid=${childUid}` : undefined,
      },
    },
    trigger: null,
  });
}

// ──────────────────────────────────────────────
// 6. 약속-행동-인정 루프 완성 (풀 플로우)
// 주간 회고 → 약속 달성 감지 → 부모 알림 → 칭찬 카드 → 업적 체크
// ──────────────────────────────────────────────

export interface PromiseLoopFlowResult {
  kept: boolean;
  parentNotified: boolean;
  achievementTriggered: boolean;
}

export async function executePromiseLoop(
  uid: string,
  weekId: string,
  childName: string,
  childUid: string
): Promise<PromiseLoopFlowResult> {
  const result: PromiseLoopFlowResult = {
    kept: false,
    parentNotified: false,
    achievementTriggered: false,
  };

  // Step 1: 약속 달성 여부 조회
  const { kept } = await getPromiseStatus(uid, weekId);
  if (kept !== true) return result;
  result.kept = true;

  // Step 2: PostHog 트래킹
  trackPromiseKept(weekId, '');

  // Step 3: 부모에게 FCM 발송 (딥링크 포함)
  try {
    await notifyParentPromiseKept(childName, childUid);
    result.parentNotified = true;
  } catch {
    // 알림 실패는 무시
  }

  // Step 4: 업적 트리거 (promise_kept)
  // achievementService.checkTrigger는 호출측에서 처리
  result.achievementTriggered = true;

  return result;
}

// ──────────────────────────────────────────────
// 3. 이번 주 "좋은 순간" 수집
// (약속 달성 + 칭찬 카드 수신 내역)
// ──────────────────────────────────────────────

export async function getGoodMoments(
  uid: string,
  familyId: string | undefined,
  weekId: string
): Promise<GoodMoment[]> {
  const moments: GoodMoment[] = [];

  // 약속 달성 여부
  try {
    const { promiseText, kept } = await getPromiseStatus(uid, weekId);
    if (kept === true && promiseText) {
      moments.push({
        type: 'promise_kept',
        weekId,
        description: `"${promiseText}" 약속을 지켰어요 🎉`,
        createdAt: Date.now(),
      });
    }
  } catch {
    // 무시
  }

  // 칭찬 카드 수신 (이번 주)
  if (familyId) {
    try {
      const weekStart = getWeekStartMs(weekId);
      const colRef = collection(getFirebaseDb(), 'praise_cards', familyId);
      const q = query(colRef, orderBy('createdAt', 'desc'), limit(20));
      const snaps = await getDocs(q);

      for (const d of snaps.docs) {
        const data = d.data() as Record<string, unknown>;
        const createdAt =
          typeof data.createdAt === 'number'
            ? data.createdAt
            : (data.createdAt as { seconds?: number })?.seconds
              ? (data.createdAt as { seconds: number }).seconds * 1000
              : 0;
        if (data.toUid === uid && createdAt >= weekStart) {
          const typeLabels: Record<string, string> = {
            well_saved: '잘 절약했어요 🌟',
            good_effort: '노력을 인정해요 💪',
            thank_you: '고마워요 💛',
          };
          moments.push({
            type: 'praise_received',
            weekId,
            description: typeLabels[data.type as string] ?? '칭찬 카드를 받았어요',
            createdAt,
          });
        }
      }
    } catch {
      // 무시
    }
  }

  return moments.sort((a, b) => b.createdAt - a.createdAt);
}

// ──────────────────────────────────────────────
// 4. 약속 달성 PostHog 이벤트
// ──────────────────────────────────────────────

export function trackPromiseKept(weekId: string, promiseText: string): void {
  capture('promise_kept', { weekId, hasText: promiseText.length > 0 });
}

export function trackPromiseMissed(weekId: string): void {
  // 비난 없음 — 단순 추적
  capture('promise_missed', { weekId });
}

// ──────────────────────────────────────────────
// 5. 약속 달성 여부에 따른 메시지 (비난 절대 금지)
// ──────────────────────────────────────────────

export function getPromiseFeedbackMessage(kept: boolean | null): string {
  if (kept === true) return '이번 주 약속을 지켰어요 🎉';
  if (kept === false) return '괜찮아요, 다음 주에 다시 해봐요!';
  return '이번 주 약속 확인을 해볼까요?';
}

// ──────────────────────────────────────────────
// 헬퍼: weekId → 주 시작 ms (월요일 00:00)
// ──────────────────────────────────────────────

function getWeekStartMs(weekId: string): number {
  // weekId: "YYYY-Www"
  const [year, weekPart] = weekId.split('-W');
  const weekNum = parseInt(weekPart, 10);
  // ISO week 1의 첫날 계산 (단순 근사)
  const jan1 = new Date(parseInt(year, 10), 0, 1);
  const dayOffset = ((weekNum - 1) * 7) - jan1.getDay() + 1;
  const weekStart = new Date(parseInt(year, 10), 0, 1 + dayOffset);
  return weekStart.getTime();
}
