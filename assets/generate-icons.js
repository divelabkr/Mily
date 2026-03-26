#!/usr/bin/env node
// ──────────────────────────────────────────────
// generate-icons.js — Mily 앱 아이콘 + 스플래시 생성
// 사용법: npm run generate:icons
// 의존성: npm install -D sharp (최초 1회)
// ──────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

const BROWN_DARK = '#4A3728';
const CREAM = '#FAF7F2';
const CORAL = '#E8503A';

const SIZES = {
  'images/icon.png': { width: 1024, height: 1024 },
  'images/splash-icon.png': { width: 1242, height: 2688 },
  'images/adaptive-icon.png': { width: 1024, height: 1024 },
  'images/notification-icon.png': { width: 96, height: 96 },
  'images/favicon.png': { width: 32, height: 32 },
};

async function generateIcons() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  sharp 패키지가 필요합니다');
    console.log('');
    console.log('  npm install -D sharp');
    console.log('');
    console.log('설치 후 다시 실행해주세요:');
    console.log('  npm run generate:icons');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('또는 아래 사이즈로 수동 생성해주세요:');
    Object.entries(SIZES).forEach(([file, { width, height }]) => {
      console.log(`  assets/${file}: ${width}x${height}px`);
    });
    console.log('');
    console.log('배경색: ' + BROWN_DARK);
    console.log('아이콘: 🌱 + "Mily" (DM Serif Display)');
    return;
  }

  const assetsDir = path.join(__dirname);

  for (const [file, { width, height }] of Object.entries(SIZES)) {
    const filePath = path.join(assetsDir, file);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // SVG 기반 아이콘 생성
    const isIcon = width === height;
    const fontSize = isIcon ? Math.floor(width * 0.3) : Math.floor(width * 0.15);
    const emojiSize = isIcon ? Math.floor(width * 0.25) : Math.floor(width * 0.1);
    const cx = width / 2;
    const cy = height / 2;

    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${BROWN_DARK}" />
        <text x="${cx}" y="${cy - fontSize * 0.3}" text-anchor="middle" font-family="serif" font-size="${emojiSize}" fill="${CREAM}">🌱</text>
        <text x="${cx}" y="${cy + fontSize * 0.5}" text-anchor="middle" font-family="serif" font-weight="bold" font-size="${fontSize}" fill="${CREAM}">Mily</text>
        ${!isIcon ? `<text x="${cx}" y="${cy + fontSize * 1.1}" text-anchor="middle" font-family="sans-serif" font-size="${Math.floor(fontSize * 0.4)}" fill="${CREAM}80">미루지 않는 경제 대화</text>` : ''}
      </svg>
    `;

    await sharp(Buffer.from(svg)).png().toFile(filePath);
    console.log(`✅ ${file} (${width}x${height})`);
  }

  console.log('');
  console.log('✅ 아이콘 생성 완료!');
  console.log('⚠️  이 아이콘은 임시용입니다. 출시 전 디자이너 에셋으로 교체해주세요.');
}

generateIcons().catch(console.error);
