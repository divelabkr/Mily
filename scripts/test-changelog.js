/**
 * test-changelog.js — 로컬 테스트용
 * 실행: node scripts/test-changelog.js
 *
 * ANTHROPIC_API_KEY 없이도 커밋 수집 + 버전 감지 로직을 확인할 수 있음.
 * API 키가 있으면 실제 Claude API 호출까지 테스트 가능.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ──────────────────────────────────────────────
// 커밋 수집 테스트
// ──────────────────────────────────────────────

function testCommitCollection() {
  console.log('=== [1] 최근 커밋 수집 ===');
  try {
    const raw = execSync('git log -10 --pretty=format:"%H|%s|%ad" --date=short', {
      encoding: 'utf8',
      cwd: path.join(__dirname, '..'),
    });

    const commits = raw
      .split('\n')
      .map((line) => {
        const [hash, subject, date] = line.split('|');
        return {
          hash: (hash || '').trim().slice(0, 7),
          subject: (subject || '').trim(),
          date: (date || '').trim(),
        };
      })
      .filter((c) => c.subject && !c.subject.includes('[skip ci]'));

    if (commits.length === 0) {
      console.log('  [skip ci] 제외 후 커밋 없음');
    } else {
      commits.forEach((c) => console.log(`  ${c.hash}  ${c.date}  ${c.subject}`));
    }
    return commits;
  } catch (err) {
    console.error('  커밋 수집 실패:', err.message);
    return [];
  }
}

// ──────────────────────────────────────────────
// 버전 감지 테스트
// ──────────────────────────────────────────────

function testVersionDetection(commits) {
  console.log('\n=== [2] 버전 증가 타입 감지 ===');

  const hasMajor = commits.some((c) => c.subject.includes('BREAKING'));
  const hasMinor = commits.some((c) => /^feat(\(.+\))?[!:]/.test(c.subject));
  const hasPatch = commits.some((c) => /^fix(\(.+\))?[!:]/.test(c.subject));

  const bumpType = hasMajor ? 'major' : hasMinor ? 'minor' : hasPatch ? 'patch' : null;

  const pkgPath = path.join(__dirname, '../package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const currentVersion = pkg.version;

  console.log(`  현재 버전: ${currentVersion}`);
  console.log(`  BREAKING: ${hasMajor}`);
  console.log(`  feat: ${hasMinor}`);
  console.log(`  fix: ${hasPatch}`);
  console.log(`  감지된 bump 타입: ${bumpType ?? '없음'}`);

  if (bumpType) {
    const parts = currentVersion.split('.').map(Number);
    let next;
    if (bumpType === 'major') next = `${parts[0] + 1}.0.0`;
    else if (bumpType === 'minor') next = `${parts[0]}.${parts[1] + 1}.0`;
    else next = `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    console.log(`  예상 다음 버전: ${next}`);
  }
}

// ──────────────────────────────────────────────
// Claude API 연결 테스트 (API 키 있을 때만)
// ──────────────────────────────────────────────

async function testClaudeApi(commits) {
  console.log('\n=== [3] Claude API 연결 테스트 ===');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log('  ANTHROPIC_API_KEY 없음 — API 호출 스킵 (정상)');
    console.log('  실제 테스트: ANTHROPIC_API_KEY=... node scripts/test-changelog.js');
    return;
  }

  if (commits.length === 0) {
    console.log('  커밋 없음 — API 호출 스킵');
    return;
  }

  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic();

    const commitList = commits
      .slice(0, 3) // 테스트는 3개만
      .map((c) => `- ${c.subject}`)
      .join('\n');

    console.log('  API 호출 중 (3개 커밋, max_tokens: 256)...');

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `아래 커밋 메시지들을 한국어로 한 줄씩 요약해줘:\n${commitList}`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '(텍스트 없음)';
    console.log('\n  Claude 응답:\n');
    text.split('\n').forEach((line) => console.log('    ' + line));
    console.log('\n  API 연결 성공!');
  } catch (err) {
    console.error('  API 호출 실패:', err.message);
  }
}

// ──────────────────────────────────────────────
// CHANGELOG.md 확인
// ──────────────────────────────────────────────

function testChangelogFile() {
  console.log('\n=== [4] CHANGELOG.md 상태 ===');
  const changelogPath = path.join(__dirname, '../CHANGELOG.md');
  if (!fs.existsSync(changelogPath)) {
    console.log('  파일 없음');
    return;
  }
  const content = fs.readFileSync(changelogPath, 'utf8');
  const lines = content.split('\n');
  console.log(`  총 ${lines.length}줄`);
  console.log('  첫 5줄:');
  lines.slice(0, 5).forEach((l) => console.log('    ' + l));
}

// ──────────────────────────────────────────────
// 실행
// ──────────────────────────────────────────────

async function main() {
  console.log('Mily Auto Changelog — 로컬 테스트\n');

  const commits = testCommitCollection();
  testVersionDetection(commits);
  await testClaudeApi(commits);
  testChangelogFile();

  console.log('\n=== 테스트 완료 ===');
}

main().catch((err) => {
  console.error('테스트 오류:', err.message);
  process.exit(1);
});
