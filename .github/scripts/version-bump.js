/**
 * version-bump.js
 * 커밋 메시지 분석 → package.json 버전 자동 증가
 * major: BREAKING 포함
 * minor: feat 포함
 * patch: fix 포함
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PKG_PATH = path.join(__dirname, '../../package.json');

// ──────────────────────────────────────────────
// 1. 최근 커밋에서 버전 타입 결정
// ──────────────────────────────────────────────

function detectBumpType() {
  let commits;
  try {
    const raw = execSync('git log -10 --pretty=format:"%s"', { encoding: 'utf8' });
    commits = raw
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s && !s.includes('[skip ci]'));
  } catch {
    return null;
  }

  if (commits.length === 0) return null;

  // BREAKING CHANGE → major
  if (commits.some((c) => c.includes('BREAKING'))) return 'major';

  // feat → minor
  if (commits.some((c) => /^feat(\(.+\))?[!:]/.test(c))) return 'minor';

  // fix → patch
  if (commits.some((c) => /^fix(\(.+\))?[!:]/.test(c))) return 'patch';

  return null;
}

// ──────────────────────────────────────────────
// 2. 버전 문자열 증가
// ──────────────────────────────────────────────

function bumpVersion(current, type) {
  const parts = current.split('.').map(Number);
  const [major, minor, patch] = parts;

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      return current;
  }
}

// ──────────────────────────────────────────────
// 3. package.json 업데이트
// ──────────────────────────────────────────────

function main() {
  const bumpType = detectBumpType();

  if (!bumpType) {
    console.log('버전 증가 해당 없음 (feat/fix/BREAKING 없음). 스킵.');
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
  const oldVersion = pkg.version;
  const newVersion = bumpVersion(oldVersion, bumpType);

  if (oldVersion === newVersion) {
    console.log('버전 변경 없음. 스킵.');
    return;
  }

  pkg.version = newVersion;
  fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

  console.log(`버전 업데이트: ${oldVersion} → ${newVersion} (${bumpType})`);
}

main();
