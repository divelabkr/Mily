/**
 * privacyGranular.test.ts
 * 세분화된 프라이버시 공개 설정 단위 테스트
 * 역전된 프라이버시: 자녀 주도 공개 범위 제어
 */

import {
  SHARE_MODE_OPTIONS,
  SHARE_EXPIRY_MS,
  createShareExpiry,
  isShareExpired,
  getParentViewInfo,
  buildFilteredSummary,
} from '../src/engines/family/privacyShareService';

import {
  defaultPrivacySettings,
  PrivacySettings,
} from '../src/engines/family/privacySettings';

// firebase 모킹 (loadPrivacySettings에서 필요)
jest.mock('../src/lib/firebase', () => ({
  getFirebaseDb: jest.fn(() => ({})),
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
}));

const ALL_CATEGORIES = ['food', 'transport', 'entertainment', 'fashion', 'study'] as const;
type TestCategoryId = typeof ALL_CATEGORIES[number];

function makeSettings(overrides?: Record<string, any>): PrivacySettings {
  return {
    ...defaultPrivacySettings('child1', 'family1'),
    ...overrides,
  } as PrivacySettings;
}

// ──────────────────────────────────────────────
// 1. SHARE_MODE_OPTIONS 구조
// ──────────────────────────────────────────────

describe('SHARE_MODE_OPTIONS', () => {
  it('3개 모드 옵션', () => {
    expect(SHARE_MODE_OPTIONS).toHaveLength(3);
  });

  it('total_only / categories_only / full 순서', () => {
    expect(SHARE_MODE_OPTIONS[0].mode).toBe('total_only');
    expect(SHARE_MODE_OPTIONS[1].mode).toBe('categories_only');
    expect(SHARE_MODE_OPTIONS[2].mode).toBe('full');
  });
});

// ──────────────────────────────────────────────
// 2. defaultPrivacySettings() — 새 필드 포함
// ──────────────────────────────────────────────

describe('defaultPrivacySettings()', () => {
  it('기본 shareMode = total_only', () => {
    const s = defaultPrivacySettings('uid', 'fid');
    expect(s.shareMode).toBe('total_only');
  });

  it('기본 shareExpiresAt = null (만료 없음)', () => {
    const s = defaultPrivacySettings('uid', 'fid');
    expect(s.shareExpiresAt).toBeNull();
  });

  it('기본 sharedCategories = [] (전부 off)', () => {
    const s = defaultPrivacySettings('uid', 'fid');
    expect(s.sharedCategories).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────
// 3. createShareExpiry()
// ──────────────────────────────────────────────

describe('createShareExpiry()', () => {
  it('현재 시각 + 7일 반환', () => {
    const before = Date.now();
    const expiry = createShareExpiry();
    const after = Date.now();
    expect(expiry).toBeGreaterThanOrEqual(before + SHARE_EXPIRY_MS);
    expect(expiry).toBeLessThanOrEqual(after + SHARE_EXPIRY_MS);
  });

  it('SHARE_EXPIRY_MS = 7일(ms)', () => {
    expect(SHARE_EXPIRY_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

// ──────────────────────────────────────────────
// 4. isShareExpired()
// ──────────────────────────────────────────────

describe('isShareExpired()', () => {
  it('shareExpiresAt=null → 만료 아님', () => {
    expect(isShareExpired(makeSettings({ shareExpiresAt: null }))).toBe(false);
  });

  it('미래 만료 시각 → 만료 아님', () => {
    const s = makeSettings({ shareExpiresAt: Date.now() + 100_000 });
    expect(isShareExpired(s)).toBe(false);
  });

  it('과거 만료 시각 → 만료', () => {
    const s = makeSettings({ shareExpiresAt: Date.now() - 100_000 });
    expect(isShareExpired(s)).toBe(true);
  });
});

// ──────────────────────────────────────────────
// 5. getParentViewInfo()
// ──────────────────────────────────────────────

describe('getParentViewInfo()', () => {
  it('sharedCategories=[] → visibleCategories=[], 전부 hidden', () => {
    const s = makeSettings({ sharedCategories: [] });
    const info = getParentViewInfo(s, ALL_CATEGORIES as any);
    expect(info.visibleCategories).toHaveLength(0);
    expect(info.hiddenCategories).toHaveLength(ALL_CATEGORIES.length);
  });

  it('total_only 모드 → visibleCategories=[] (카테고리 목록 미공개)', () => {
    const s = makeSettings({
      shareMode: 'total_only',
      sharedCategories: ['food', 'transport'],
    });
    const info = getParentViewInfo(s, ALL_CATEGORIES as any);
    expect(info.visibleCategories).toHaveLength(0);
  });

  it('categories_only 모드 → sharedCategories가 visibleCategories', () => {
    const s = makeSettings({
      shareMode: 'categories_only',
      sharedCategories: ['food', 'transport'],
    });
    const info = getParentViewInfo(s, ALL_CATEGORIES as any);
    expect(info.visibleCategories).toContain('food');
    expect(info.visibleCategories).toContain('transport');
    expect(info.hiddenCategories).toContain('entertainment');
  });

  it('full 모드 → sharedCategories가 visibleCategories', () => {
    const s = makeSettings({
      shareMode: 'full',
      sharedCategories: ['food'],
    });
    const info = getParentViewInfo(s, ALL_CATEGORIES as any);
    expect(info.visibleCategories).toContain('food');
  });

  it('만료된 설정 → visibleCategories=[], isExpired=true', () => {
    const s = makeSettings({
      sharedCategories: ['food'],
      shareExpiresAt: Date.now() - 1,
    });
    const info = getParentViewInfo(s, ALL_CATEGORIES as any);
    expect(info.isExpired).toBe(true);
    expect(info.visibleCategories).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────
// 6. buildFilteredSummary()
// ──────────────────────────────────────────────

describe('buildFilteredSummary()', () => {
  const checkIns = [
    { categoryId: 'food',          amount: 15000 },
    { categoryId: 'transport',     amount: 5000 },
    { categoryId: 'entertainment', amount: 20000 },
  ] as any[];

  it('total_only → categoryBreakdown=null, totalAmount만 반환', () => {
    const s = makeSettings({
      shareMode: 'total_only',
      sharedCategories: ['food', 'transport'],
    });
    const result = buildFilteredSummary(checkIns, s);
    expect(result.categoryBreakdown).toBeNull();
    expect(result.totalAmount).toBe(20000); // food+transport
  });

  it('categories_only → categoryBreakdown 포함', () => {
    const s = makeSettings({
      shareMode: 'categories_only',
      sharedCategories: ['food', 'transport'],
    });
    const result = buildFilteredSummary(checkIns, s);
    expect(result.categoryBreakdown).not.toBeNull();
    expect(result.categoryBreakdown!.length).toBe(2);
  });

  it('공유 안 된 카테고리 필터링', () => {
    const s = makeSettings({
      shareMode: 'categories_only',
      sharedCategories: ['food'],
    });
    const result = buildFilteredSummary(checkIns, s);
    const ids = result.categoryBreakdown!.map((b) => b.categoryId);
    expect(ids).not.toContain('entertainment');
    expect(ids).not.toContain('transport');
  });

  it('만료된 설정 → totalAmount=0, isExpired=true', () => {
    const s = makeSettings({
      sharedCategories: ['food'],
      shareExpiresAt: Date.now() - 1,
    });
    const result = buildFilteredSummary(checkIns, s);
    expect(result.isExpired).toBe(true);
    expect(result.totalAmount).toBe(0);
  });
});
