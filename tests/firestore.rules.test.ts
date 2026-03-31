/**
 * firestore.rules.test.ts
 * Firestore 보안 룰 구조 검증 테스트
 *
 * 실제 Emulator 기반 테스트는 `firebase emulators:exec` 환경에서 실행.
 * 여기서는 rules 파일의 구조/정책 선언 존재 여부를 검증한다.
 */

import * as fs from 'fs';
import * as path from 'path';

const RULES_PATH = path.resolve(__dirname, '../firestore.rules');
const rulesContent = fs.readFileSync(RULES_PATH, 'utf-8');

describe('firestore.rules — 구조 검증', () => {

  // ── 기본 컬렉션 존재 여부 ─────────────────────

  it('rules_version 2 선언', () => {
    expect(rulesContent).toContain("rules_version = '2'");
  });

  it('users/{uid} 규칙 존재', () => {
    expect(rulesContent).toMatch(/match \/users\/\{uid\}/);
  });

  it('families/{familyId} 규칙 존재', () => {
    expect(rulesContent).toMatch(/match \/families\/\{familyId\}/);
  });

  it('request_cards 규칙 존재', () => {
    expect(rulesContent).toMatch(/match \/request_cards\/\{familyId\}\/\{cardId\}/);
  });

  it('praise_cards 규칙 존재', () => {
    expect(rulesContent).toMatch(/match \/praise_cards\/\{familyId\}\/\{cardId\}/);
  });

  // ── 추가된 컬렉션 ───────────────────────────

  it('users/{uid}/coupons 규칙 존재 (쿠폰 서브컬렉션)', () => {
    expect(rulesContent).toMatch(/match \/coupons\/\{couponId\}/);
  });

  it('achievements/{uid} 규칙 존재', () => {
    expect(rulesContent).toMatch(/match \/achievements\/\{uid\}\/\{achievementId\}/);
  });

  it('achievement_stats 규칙 존재', () => {
    expect(rulesContent).toMatch(/match \/achievement_stats\/\{achievementId\}/);
  });

  it('economic_badges/{uid}/badges/{badgeId} 규칙 존재', () => {
    expect(rulesContent).toMatch(/match \/economic_badges\/\{uid\}\/badges\/\{badgeId\}/);
  });

  it('unlock_status/{uid} 규칙 존재', () => {
    expect(rulesContent).toMatch(/match \/unlock_status\/\{uid\}/);
  });

  it('ambassador_invitations 규칙 존재', () => {
    expect(rulesContent).toMatch(/match \/ambassador_invitations\/\{familyId\}/);
  });

  // ── 보안 정책 패턴 검증 ───────────────────────

  it('쿠폰 클라이언트 직접 쓰기 금지 (allow write: if false)', () => {
    // coupons 섹션에 write: if false 가 있어야 함
    const couponSection = rulesContent.split('coupons')[1]?.split('match /')[0] ?? '';
    expect(couponSection).toMatch(/allow write: if false/);
  });

  it('achievement_stats 클라이언트 쓰기 금지', () => {
    const idx = rulesContent.indexOf('match /achievement_stats/');
    const section = rulesContent.slice(idx, idx + 300);
    expect(section).toMatch(/allow write: if false/);
  });

  it('request_cards — delete 금지', () => {
    const idx = rulesContent.indexOf('match /request_cards/');
    const section = rulesContent.slice(idx, idx + 700);
    expect(section).toMatch(/allow delete: if false/);
  });

  it('consents — update/delete 금지 (동의 수정 불가)', () => {
    const idx = rulesContent.indexOf('match /consents/');
    const section = rulesContent.slice(idx, idx + 600);
    expect(section).toMatch(/allow update, delete: if false/);
  });

  it('pilots — 클라이언트 완전 차단', () => {
    const idx = rulesContent.indexOf('match /pilots/');
    const section = rulesContent.slice(idx, idx + 200);
    expect(section).toMatch(/allow read, write: if false/);
  });

  it('familyId privacySettings — childUid만 W (역전된 프라이버시)', () => {
    expect(rulesContent).toMatch(/privacySettings\/\{childUid\}/);
    expect(rulesContent).toMatch(/request\.auth\.uid == childUid/);
  });

  it('subscriptions — 클라이언트 쓰기 금지', () => {
    const idx = rulesContent.indexOf('match /subscriptions/');
    const section = rulesContent.slice(idx, idx + 200);
    expect(section).toMatch(/allow write: if false/);
  });
});
