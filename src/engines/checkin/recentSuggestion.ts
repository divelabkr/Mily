import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import { CheckIn } from './checkinStore';
import { getWeekId } from '../../utils/dateUtils';

/**
 * 지난주 기록 중 최근 3건을 가져와 "지난번처럼" 재사용 후보로 반환.
 * 이번 주 기록이 없을 때만 노출 권장 (호출자가 결정).
 */
export async function loadRecentSuggestions(uid: string): Promise<CheckIn[]> {
  const currentWeekId = getWeekId();
  const lastWeekId = getPreviousWeekId(currentWeekId);

  try {
    const colRef = collection(getFirebaseDb(), 'checkins', uid, lastWeekId);
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(3));
    const snaps = await getDocs(q);

    return snaps.docs.map((d) => ({
      ...(d.data() as Omit<CheckIn, 'checkInId'>),
      checkInId: d.id,
    }));
  } catch {
    return [];
  }
}

function getPreviousWeekId(currentWeekId: string): string {
  // 형식: "YYYY-Www" → 이전 주 계산
  const [yearStr, weekStr] = currentWeekId.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  if (week <= 1) {
    // 1월 1주 → 작년 52주
    return `${year - 1}-W52`;
  }
  return `${year}-W${String(week - 1).padStart(2, '0')}`;
}
