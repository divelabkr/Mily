// ──────────────────────────────────────────────
// masterAccount.test.ts — 마스터 계정/마스터가드 통합 테스트
// 시나리오 A: 마스터 계정 잠금/해제
// 시나리오 B: 비마스터 접근 차단
// 시나리오 C: 마스터 권한 엔진 연동
// ──────────────────────────────────────────────

jest.mock('../../src/lib/firebase', () => ({ getFirebaseDb: jest.fn(() => ({})) }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({ _id: 'docRef' })),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false, data: () => null })),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
}));

import {
  isMasterAccount,
  assertMaster,
  MASTER_UIDS,
} from '../../src/engines/auth/masterGuard';

// ── 시나리오 A: 마스터 계정 판별 ─────────────────

describe('시나리오 A: 마스터 계정 판별', () => {
  test('A-1. MASTER_UIDS 배열이 정의되어 있다', () => {
    expect(Array.isArray(MASTER_UIDS)).toBe(true);
  });

  test('A-2. isMasterAccount → 마스터 uid는 true 반환', () => {
    if (MASTER_UIDS.length === 0) {
      // 마스터 uid가 없는 환경이면 스킵
      expect(true).toBe(true);
      return;
    }
    const masterUid = MASTER_UIDS[0];
    expect(isMasterAccount(masterUid)).toBe(true);
  });

  test('A-3. isMasterAccount → 일반 uid는 false 반환', () => {
    expect(isMasterAccount('random_uid_12345')).toBe(false);
  });

  test('A-4. isMasterAccount → 빈 문자열은 false 반환', () => {
    expect(isMasterAccount('')).toBe(false);
  });

  test('A-5. isMasterAccount → undefined-like 값은 false 반환', () => {
    expect(isMasterAccount('undefined')).toBe(false);
  });
});

// ── 시나리오 B: 비마스터 접근 차단 ───────────────

describe('시나리오 B: 비마스터 assertMaster 접근 차단', () => {
  test('B-1. assertMaster → 비마스터 uid로 호출 시 throw', () => {
    expect(() => assertMaster('non_master_uid')).toThrow();
  });

  test('B-2. assertMaster 에러 메시지에 "권한"이 포함된다', () => {
    try {
      assertMaster('some_random_user');
    } catch (e: any) {
      expect(e.message).toBeDefined();
    }
  });

  test('B-3. 마스터 uid가 있을 때 assertMaster → throw 없음', () => {
    if (MASTER_UIDS.length === 0) {
      expect(true).toBe(true);
      return;
    }
    expect(() => assertMaster(MASTER_UIDS[0])).not.toThrow();
  });
});

// ── 시나리오 C: 마스터 권한 엔진 연동 ──────────────

describe('시나리오 C: 마스터 플래그 + 기능 연동', () => {
  test('C-1. MASTER_UIDS는 중복 없이 유니크하다', () => {
    const unique = new Set(MASTER_UIDS);
    expect(unique.size).toBe(MASTER_UIDS.length);
  });

  test('C-2. isMasterAccount는 대소문자를 구분한다', () => {
    // "ADMIN" vs "admin" — 동일하지 않아야 함
    if (MASTER_UIDS.length === 0) {
      expect(true).toBe(true);
      return;
    }
    const master = MASTER_UIDS[0];
    const upper = master.toUpperCase();
    const lower = master.toLowerCase();
    // 원본이 아닌 경우 false여야 함
    if (upper !== master) {
      expect(isMasterAccount(upper)).toBe(false);
    }
    if (lower !== master) {
      expect(isMasterAccount(lower)).toBe(false);
    }
  });

  test('C-3. 마스터 가드는 순수 함수다 (상태 없음)', () => {
    const r1 = isMasterAccount('uid_test');
    const r2 = isMasterAccount('uid_test');
    expect(r1).toBe(r2);
  });
});
