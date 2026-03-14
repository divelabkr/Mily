/**
 * B2B 파일럿 집계 스크립트
 * 실행: npx ts-node scripts/pilot-report.ts <pilotId>
 * 요구사항: Firebase Admin SDK 환경변수 설정 필요
 *
 * 개인 식별 정보 절대 포함 금지 — 비식별 집계만 출력
 */
import * as admin from 'firebase-admin';

const pilotId = process.argv[2];
if (!pilotId) {
  console.error('사용법: npx ts-node scripts/pilot-report.ts <pilotId>');
  process.exit(1);
}

// Firebase Admin 초기화 (서비스 계정 필요)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

interface AggregatedReport {
  pilotId: string;
  generatedAt: string;
  participants: {
    total: number;
    activeThisWeek: number;
    participationRate: number;
  };
  checkins: {
    total: number;
    avgPerParticipant: number;
    categoryDistribution: Record<string, number>; // 카테고리별 비율(%)
  };
  plans: {
    avgAchievementRate: number; // 계획 달성률 평균(%)
  };
  notes: string[];
}

async function generateReport(): Promise<AggregatedReport> {
  // 1. 파일럿 문서 조회
  const pilotDoc = await db.collection('pilots').doc(pilotId).get();
  if (!pilotDoc.exists) {
    throw new Error(`Pilot ${pilotId} not found`);
  }
  const pilotData = pilotDoc.data()!;
  const memberUids: string[] = pilotData.memberUids ?? [];

  if (memberUids.length === 0) {
    throw new Error('파일럿 참가자가 없습니다.');
  }

  // 2. 참가자 활동 집계 (개인 식별 정보 제외)
  const now = new Date();
  const weekId = getWeekId(now);
  let totalCheckIns = 0;
  let activeThisWeek = 0;
  const categoryCount: Record<string, number> = {};
  let totalAchievementRate = 0;
  let achievementCount = 0;

  for (const uid of memberUids) {
    // 체크인 집계
    const checkinsSnap = await db
      .collection('checkins')
      .doc(uid)
      .listCollections();

    let userCheckInCount = 0;
    for (const weekCol of checkinsSnap) {
      const docs = await weekCol.get();
      userCheckInCount += docs.size;
      totalCheckIns += docs.size;

      if (weekCol.id === weekId) activeThisWeek++;

      // 카테고리 분포 (개인 제거)
      docs.forEach((doc) => {
        const data = doc.data();
        const cat = data.categoryId as string;
        categoryCount[cat] = (categoryCount[cat] ?? 0) + 1;
      });
    }

    // 달성률 집계 (이번 달 계획 기반)
    const monthId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const planSnap = await db
      .collection('plans')
      .doc(uid)
      .collection(monthId)
      .doc('data')
      .get();

    if (planSnap.exists) {
      const plan = planSnap.data()!;
      const weeklyBudget = Math.round(plan.totalBudget / 4);
      // 이번 주 체크인 집계
      const thisWeekSnap = await db
        .collection('checkins')
        .doc(uid)
        .collection(weekId)
        .get();

      const weeklySpent = thisWeekSnap.docs.reduce(
        (sum, d) => sum + (d.data().amount ?? 0),
        0
      );
      const rate = weeklyBudget > 0 ? Math.min(100, Math.round((weeklySpent / weeklyBudget) * 100)) : 0;
      totalAchievementRate += rate;
      achievementCount++;
    }
  }

  // 카테고리 분포 % 변환
  const categoryDistribution: Record<string, number> = {};
  if (totalCheckIns > 0) {
    for (const [cat, count] of Object.entries(categoryCount)) {
      categoryDistribution[cat] = Math.round((count / totalCheckIns) * 100);
    }
  }

  return {
    pilotId,
    generatedAt: now.toISOString(),
    participants: {
      total: memberUids.length,
      activeThisWeek,
      participationRate: Math.round((activeThisWeek / memberUids.length) * 100),
    },
    checkins: {
      total: totalCheckIns,
      avgPerParticipant:
        memberUids.length > 0
          ? Math.round(totalCheckIns / memberUids.length)
          : 0,
      categoryDistribution,
    },
    plans: {
      avgAchievementRate:
        achievementCount > 0
          ? Math.round(totalAchievementRate / achievementCount)
          : 0,
    },
    notes: [
      '개인 식별 정보 미포함 — 비식별 집계 데이터',
      `집계 기준 주: ${weekId}`,
      '체크인 수, 달성률은 자발적 기록 기반 (강제 수집 없음)',
    ],
  };
}

function getWeekId(date: Date): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const dayOfYear = Math.floor(
    (date.getTime() - startOfYear.getTime()) / 86400000
  );
  const week = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

generateReport()
  .then((report) => {
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  })
  .catch((e) => {
    console.error('오류:', e.message);
    process.exit(1);
  });
