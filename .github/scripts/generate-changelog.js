/**
 * generate-changelog.js
 * Claude API로 커밋 메시지를 한국어 요약 → CHANGELOG.md 자동 업데이트
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const CHANGELOG_PATH = path.join(__dirname, '../../CHANGELOG.md');

// ──────────────────────────────────────────────
// 1. 최근 커밋 수집 (최대 10개, [skip ci] 제외)
// ──────────────────────────────────────────────

function getRecentCommits() {
  const raw = execSync('git log -10 --pretty=format:"%H|%s|%ad" --date=short', {
    encoding: 'utf8',
  });

  const commits = raw
    .split('\n')
    .map((line) => {
      const [hash, subject, date] = line.split('|');
      return { hash: (hash || '').trim(), subject: (subject || '').trim(), date: (date || '').trim() };
    })
    .filter((c) => c.subject && !c.subject.includes('[skip ci]'));

  return commits;
}

// ──────────────────────────────────────────────
// 2. 버전 읽기 (package.json)
// ──────────────────────────────────────────────

function getCurrentVersion() {
  const pkgPath = path.join(__dirname, '../../package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return pkg.version || '0.0.0';
}

// ──────────────────────────────────────────────
// 3. Claude API 호출 — 한국어 CHANGELOG 생성
// ──────────────────────────────────────────────

async function generateChangelogEntry(commits, version) {
  const client = new Anthropic();

  const commitList = commits.map((c) => `- ${c.subject}`).join('\n');
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.');

  const prompt = `아래 git 커밋 메시지들을 분석해서 CHANGELOG 항목을 한국어로 작성해줘.

커밋 목록:
${commitList}

형식 (해당 항목이 없으면 해당 섹션 전체 생략):
### ✨ 새 기능
- 항목

### 🐛 버그 수정
- 항목

### 🔧 개선사항
- 항목

### 🏗 인프라
- 항목

규칙:
- 기술 용어(Firebase, Auth, FCM, PostHog, GitHub Actions 등)는 영어 유지
- 각 항목은 1줄로 간결하게
- 중복 제거
- feat 접두사 → 새 기능
- fix 접두사 → 버그 수정
- chore, refactor, perf 접두사 → 개선사항
- ci, build, docs 접두사 → 인프라
- 커밋이 없거나 관련 없는 경우 해당 섹션 생략
- 섹션 헤더 위에 아무것도 추가하지 말 것 (날짜/버전 헤더는 내가 추가할 예정)`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude API');
  }

  const header = `## [${version}] - ${today}\n`;
  return header + '\n' + content.text.trim() + '\n';
}

// ──────────────────────────────────────────────
// 4. CHANGELOG.md 맨 위에 새 항목 추가
// ──────────────────────────────────────────────

function prependToChangelog(newEntry) {
  let existing = '';
  if (fs.existsSync(CHANGELOG_PATH)) {
    existing = fs.readFileSync(CHANGELOG_PATH, 'utf8');
  }

  // 이미 같은 날짜+버전 항목이 있으면 스킵 (중복 방지)
  const firstLine = newEntry.split('\n')[0];
  if (existing.includes(firstLine)) {
    console.log('이미 동일한 항목이 존재합니다. 스킵.');
    return;
  }

  const separator = existing.startsWith('# CHANGELOG') ? '\n' : '';
  let header = '';
  let body = existing;

  if (existing.startsWith('# CHANGELOG')) {
    const lines = existing.split('\n');
    header = lines[0] + '\n';
    body = lines.slice(1).join('\n').trimStart();
  }

  const updated =
    (header || '# CHANGELOG\n\n') +
    separator +
    newEntry +
    '\n---\n\n' +
    body;

  fs.writeFileSync(CHANGELOG_PATH, updated, 'utf8');
  console.log('CHANGELOG.md 업데이트 완료.');
}

// ──────────────────────────────────────────────
// 5. 메인 실행
// ──────────────────────────────────────────────

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY 환경변수가 없습니다. 스킵.');
    process.exit(0);
  }

  const commits = getRecentCommits();
  if (commits.length === 0) {
    console.log('관련 커밋이 없습니다. 스킵.');
    return;
  }

  console.log(`커밋 ${commits.length}개 분석 중...`);
  commits.forEach((c) => console.log(` - ${c.subject}`));

  const version = getCurrentVersion();
  const entry = await generateChangelogEntry(commits, version);

  console.log('\n생성된 항목:\n');
  console.log(entry);

  prependToChangelog(entry);
}

main().catch((err) => {
  console.error('generate-changelog 오류:', err.message);
  process.exit(1);
});
