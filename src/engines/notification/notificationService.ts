import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// 알림 설정: 22:00~08:00 금지, 주 최대 3회
const QUIET_HOURS_START = 22;
const QUIET_HOURS_END = 8;
const MAX_WEEKLY_NOTIFICATIONS = 3;

// ──────────────────────────────────────────────
// 권한 요청
// ──────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ──────────────────────────────────────────────
// 알림 허용 시간대 확인
// ──────────────────────────────────────────────

export function isAllowedHour(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= QUIET_HOURS_END && hour < QUIET_HOURS_START;
}

// ──────────────────────────────────────────────
// 주간 회고 리마인드 (일요일 18:00)
// ──────────────────────────────────────────────

export async function scheduleWeeklyReviewReminder(): Promise<void> {
  if (!(await requestNotificationPermission())) return;

  // 기존 회고 리마인드 취소
  await cancelNotificationByType('weekly_review');

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Mily',
      body: '이번 주 돌아볼 시간이에요. 5분이면 충분해요.',
      data: { type: 'weekly_review' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // 일요일 (1=일, 2=월, ..., 7=토)
      hour: 18,
      minute: 0,
    },
  });
}

// ──────────────────────────────────────────────
// 요청 카드 수신 알림 (즉시)
// ──────────────────────────────────────────────

export async function notifyRequestCardReceived(
  childName: string
): Promise<void> {
  if (!(await requestNotificationPermission())) return;
  if (!isAllowedHour()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Mily — 요청 카드',
      body: `${childName}님의 요청이 도착했어요.`,
      data: { type: 'request_card' },
    },
    trigger: null, // 즉시
  });
}

// ──────────────────────────────────────────────
// 부모 응답 알림 (자녀에게)
// ──────────────────────────────────────────────

export async function notifyParentResponse(
  responseLabel: string
): Promise<void> {
  if (!(await requestNotificationPermission())) return;
  if (!isAllowedHour()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Mily — 응답 도착',
      body: `부모님이 "${responseLabel}"으로 응답했어요.`,
      data: { type: 'parent_response' },
    },
    trigger: null,
  });
}

// ──────────────────────────────────────────────
// 특정 타입 알림 취소
// ──────────────────────────────────────────────

async function cancelNotificationByType(type: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if ((n.content.data as Record<string, unknown>)?.type === type) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}

// ──────────────────────────────────────────────
// 쿠폰 수신 알림 — 자녀에게 직접 발송 (앱 내 전용)
// 모든 문구 "Mily"로 통일, 운영자 이름 노출 금지
// ──────────────────────────────────────────────

export async function notifyCouponReceived(
  _recipientUid: string,
  brand: string,
  value: number
): Promise<void> {
  if (!(await requestNotificationPermission())) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎁 Mily가 깜짝 선물을 보냈어요!',
      body: `${brand} ${value.toLocaleString()}원 쿠폰이 도착했어요`,
      data: { type: 'coupon_received' },
    },
    trigger: null, // 즉시
  });
}

// ──────────────────────────────────────────────
// 부모 쿠폰 알림 — 자녀 설정 ON일 때만 발송
// ──────────────────────────────────────────────

export async function notifyParentCouponAlert(
  _familyId: string,
  _childUid: string
): Promise<void> {
  if (!(await requestNotificationPermission())) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎁 자녀가 Mily에서 선물을 받았어요!',
      body: '쿠폰함을 확인해보세요',
      data: { type: 'parent_coupon_alert' },
    },
    trigger: null, // 즉시
  });
}

// ──────────────────────────────────────────────
// 알림 핸들러 초기화 (앱 시작 시)
// ──────────────────────────────────────────────

export function initNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowList: true,
    }),
  });
}
