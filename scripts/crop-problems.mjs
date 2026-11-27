#!/usr/bin/env node
// 문항 YAML의 paperPage + paperCrop 으로 공식 문제지에서 문항 영역을 잘라
// .cache/crops/<id>.png 로 저장한다. 문제를 텍스트로 옮겨 적을 때 원문과 대조하는 용도이며 화면에는 쓰지 않는다.
// macOS(PDFKit) 전용.
// 사용법: npm run crop            # 이미지가 없는 문항만
//         npm run crop -- --all   # 전부 다시
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const all = process.argv.includes('--all');
const outDir = `${root}.cache/crops`;
const cacheDir = `${root}.cache/papers`;
mkdirSync(outDir, { recursive: true });
mkdirSync(cacheDir, { recursive: true });

// exams.ts에서 회차별 paperUrl을 읽는다 (단순 파싱).
const examsSrc = readFileSync(`${root}src/lib/exams.ts`, 'utf8');
const paperUrl = (year, kind) => {
  const block = examsSrc.split(/\n  \{\n/).find((b) => b.includes(`year: ${year},`) && b.includes(`kind: '${kind}'`));
  return block?.match(/paperUrl: '([^']+)'/)?.[1];
};

async function paperFile(url) {
  const file = `${cacheDir}/${url.split('/').pop().replace(/[^\w.-]/g, '_')}`;
  if (!existsSync(file)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return file;
}

const dir = `${root}content/problems`;
for (const name of readdirSync(dir).filter((f) => f.endsWith('.yaml') && !f.startsWith('_'))) {
  const id = name.replace(/\.yaml$/, '');
  const out = `${outDir}/${id}.png`;
  if (!all && existsSync(out)) continue;
  const src = readFileSync(`${dir}/${name}`, 'utf8');
  const page = src.match(/^paperPage:\s*(\d+)/m)?.[1];
  const crop = src.match(/^paperCrop:\s*\[([^\]]+)\]/m)?.[1]?.split(',').map((s) => s.trim());
  if (!page || !crop) {
    console.log(`건너뜀 ${id}: paperPage 또는 paperCrop 없음`);
    continue;
  }
  const [, year, kind] = id.match(/^(\d{4})-(\w+?)-/);
  const url = paperUrl(year, kind);
  if (!url) {
    console.log(`건너뜀 ${id}: exams.ts에 paperUrl 없음`);
    continue;
  }
  const pdf = await paperFile(url);
  execFileSync('swift', [`${root}scripts/crop-pdf.swift`, pdf, page, ...crop, '2.4', out], { stdio: 'inherit' });
  console.log(`생성 ${out}`);
}
