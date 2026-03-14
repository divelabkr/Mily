/**
 * 마스터 계정 생성/권한 부여 스크립트
 *
 * 사용법:
 *   npx ts-node scripts/create-master.ts <email> <password>
 *
 * 예시:
 *   npx ts-node scripts/create-master.ts master@example.com Password123!
 *
 * 동작:
 *   1. 이메일로 기존 계정 조회 (없으면 생성)
 *   2. Custom Claim { role: 'master' } 부여
 *   3. Firestore users/{uid} 에 마스터 정보 기록
 *
 * 요구사항:
 *   - GOOGLE_APPLICATION_CREDENTIALS 환경변수 (서비스 계정 JSON 경로)
 *   - 또는 gcloud auth application-default login
 */

import * as admin from 'firebase-admin';

// ──────────────────────────────────────────────
// 인자 파싱
// ──────────────────────────────────────────────

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error('사용법: npx ts-node scripts/create-master.ts <email> <password>');
  console.error('예시:  npx ts-node scripts/create-master.ts admin@mily.app P@ssword123!');
  process.exit(1);
}

if (password.length < 8) {
  console.error('비밀번호는 8자 이상이어야 합니다.');
  process.exit(1);
}

// ──────────────────────────────────────────────
// Firebase Admin 초기화
// ──────────────────────────────────────────────

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const auth = admin.auth();
const db = admin.firestore();

// ──────────────────────────────────────────────
// 메인
// ──────────────────────────────────────────────

async function createMaster(): Promise<void> {
  let uid: string;

  // 1. 기존 계정 확인
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    console.log(`기존 계정 발견: ${uid}`);
  } catch {
    // 없으면 신규 생성
    const created = await auth.createUser({
      email,
      password,
      displayName: '밀리 마스터',
      emailVerified: true,
    });
    uid = created.uid;
    console.log(`신규 계정 생성: ${uid}`);
  }

  // 2. Custom Claim 부여
  await auth.setCustomUserClaims(uid, { role: 'master' });
  console.log(`Custom Claim 부여: { role: 'master' }`);

  // 3. Firestore users/{uid} 기록 (마스터 메타데이터)
  await db.collection('users').doc(uid).set(
    {
      uid,
      email,
      displayName: '밀리 마스터',
      role: 'individual',          // 앱 내 기본 역할 (마스터는 Claim으로 판별)
      isMasterGrantedAt: admin.firestore.FieldValue.serverTimestamp(),
      onboardingComplete: true,
    },
    { merge: true }
  );
  console.log(`Firestore users/${uid} 기록 완료`);

  // 4. 결과 출력
  const verifyUser = await auth.getUser(uid);
  console.log('\n마스터 계정 생성 완료');
  console.log('────────────────────────────');
  console.log(`uid:    ${verifyUser.uid}`);
  console.log(`email:  ${verifyUser.email}`);
  console.log(`claims: ${JSON.stringify(verifyUser.customClaims)}`);
  console.log('────────────────────────────');
  console.log('※ 앱에서 로그아웃 후 재로그인 시 마스터 권한 활성화됨');
}

createMaster()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('오류:', e.message);
    process.exit(1);
  });
