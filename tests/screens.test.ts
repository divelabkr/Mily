// ──────────────────────────────────────────────
// screens.test.ts — 신규 화면 + DrawerNavigator 테스트
// ──────────────────────────────────────────────

jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  SafeAreaView: 'SafeAreaView',
  StyleSheet: { create: (s: any) => s },
}));
jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
jest.mock('../src/engines/auth/authStore', () => ({ useAuthStore: jest.fn() }));
jest.mock('../src/engines/message/dnaFilter', () => ({
  filterDna: jest.fn(() => ({ passed: true, violations: [] })),
  assertDnaClean: jest.fn(),
}));

import {
  getAdultMenuItems,
  getChildMenuItems,
  FeatureFlagMap,
} from '../src/navigation/DrawerNavigator';

import { CashFlowData, WealthLevel } from '../src/engines/cashflow/cashFlowEngine';
import { FamilyStatement, StatementDiff, buildStatementSummary, buildStatement, BuildStatementInput } from '../src/engines/cashflow/financialStatementService';
import { FamilyContract, ContractStatus } from '../src/engines/familyBank/familyBankService';
import { TrustLevel } from '../src/engines/familyBank/trustScoreService';
import { LifeEvent, LifeEventType, LIFE_EVENTS } from '../src/engines/cashflow/lifeEventService';
import { getRoleModels } from '../src/engines/millionaire/roleModelService';
import { getDreamScenarios, calculateTimeToAchieve, getDreamById } from '../src/engines/millionaire/dreamScenarioService';
import {
  APP_STORE_TITLE,
  APP_STORE_SUBTITLE,
  APP_STORE_KEYWORDS,
  APP_STORE_DESCRIPTION,
  PRIVACY_URL,
  TERMS_URL,
} from '../src/constants/storeMetadata';

const t = (key: string) => key;

// ── DrawerNavigator 메뉴 테스트 ──────────────

describe('DrawerNavigator menu items', () => {
  test('1. Adult menu: flags off → 기존 메뉴만', () => {
    const items = getAdultMenuItems(t, true, 0, {});
    const keys = items.map((i) => i.key);
    expect(keys).not.toContain('cashflow');
    expect(keys).not.toContain('familybank');
    expect(keys).not.toContain('millionaire');
    expect(keys).toContain('home');
    expect(keys).toContain('settings');
  });

  test('2. Adult menu: cashflow flag on → 캐시플로우 메뉴 표시', () => {
    const items = getAdultMenuItems(t, true, 0, { cashflow_engine_enabled: true });
    const keys = items.map((i) => i.key);
    expect(keys).toContain('cashflow');
  });

  test('3. Adult menu: family_bank flag on → 가족 약속 기록함 메뉴 표시', () => {
    const items = getAdultMenuItems(t, true, 0, { family_bank_enabled: true });
    expect(items.map((i) => i.key)).toContain('promise');
  });

  test('4. Adult menu: millionaire flag on → 꿈 설계소 메뉴 표시', () => {
    const items = getAdultMenuItems(t, true, 0, { millionaire_enabled: true });
    expect(items.map((i) => i.key)).toContain('dream');
  });

  test('5. Child menu: flags off → 기존 메뉴만', () => {
    const items = getChildMenuItems(t, {});
    const keys = items.map((i) => i.key);
    expect(keys).not.toContain('dream');
    expect(keys).not.toContain('familybank');
    expect(keys).toContain('home');
  });

  test('6. Child menu: millionaire on → 꿈 계산기 표시', () => {
    const items = getChildMenuItems(t, { millionaire_enabled: true });
    expect(items.map((i) => i.key)).toContain('dream');
  });

  test('7. Child menu: family_bank on → 가족 약속 기록함 표시', () => {
    const items = getChildMenuItems(t, { family_bank_enabled: true });
    expect(items.map((i) => i.key)).toContain('promise');
  });

  test('8. Adult menu: all flags on → 9 items (parent)', () => {
    const allFlags: FeatureFlagMap = {
      cashflow_engine_enabled: true,
      family_bank_enabled: true,
      millionaire_enabled: true,
    };
    const items = getAdultMenuItems(t, true, 0, allFlags);
    expect(items.length).toBe(9);
  });
});

// ── 스토어 메타데이터 ────────────────────────

describe('Store metadata', () => {
  test('9. APP_STORE_TITLE contains Mily', () => {
    expect(APP_STORE_TITLE).toContain('Mily');
  });

  test('10. APP_STORE_DESCRIPTION contains "금융 서비스가 아닙니다"', () => {
    expect(APP_STORE_DESCRIPTION).toContain('금융 서비스가 아닙니다');
  });

  test('11. PRIVACY_URL and TERMS_URL are valid URLs', () => {
    expect(PRIVACY_URL).toMatch(/^https:\/\//);
    expect(TERMS_URL).toMatch(/^https:\/\//);
  });

  test('12. APP_STORE_KEYWORDS has at least 5 keywords', () => {
    const keywords = APP_STORE_KEYWORDS.split(',');
    expect(keywords.length).toBeGreaterThanOrEqual(5);
  });

  test('13. APP_STORE_SUBTITLE is under 50 characters', () => {
    expect(APP_STORE_SUBTITLE.length).toBeLessThanOrEqual(50);
  });

  test('14. Description does not contain DNA forbidden words', () => {
    const forbidden = ['통제', '감시', '훈계', '실시간 추적', '소비 성적'];
    for (const word of forbidden) {
      expect(APP_STORE_DESCRIPTION).not.toContain(word);
    }
  });

  test('15. Description mentions key features', () => {
    expect(APP_STORE_DESCRIPTION).toContain('요청 카드');
    expect(APP_STORE_DESCRIPTION).toContain('프라이버시');
    expect(APP_STORE_DESCRIPTION).toContain('패밀리 뱅크');
    expect(APP_STORE_DESCRIPTION).toContain('캐시플로우');
  });
});
