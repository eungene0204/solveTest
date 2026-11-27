#!/usr/bin/env node
// 사용법: npm run new -- <학년도> <번호> [suneung|june|sept]
// 예: npm run new -- 2027 22
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const [year, number, kind = 'suneung'] = process.argv.slice(2);
if (!/^20\d{2}$/.test(year ?? '') || !/^\d{1,2}$/.test(number ?? '') || !['suneung', 'june', 'sept'].includes(kind)) {
  console.error('사용법: npm run new -- <학년도> <번호> [suneung|june|sept]');
  process.exit(1);
}
const root = new URL('..', import.meta.url);
const target = new URL(`content/problems/${year}-${kind}-math-${Number(number)}.yaml`, root);
if (existsSync(target)) {
  console.error(`이미 있습니다: ${fileURLToPath(target)}`);
  process.exit(1);
}
const template = readFileSync(new URL('templates/problem.yaml', root), 'utf8')
  .replace('__YEAR__', year)
  .replace('__KIND__', kind)
  .replace('__NUMBER__', String(Number(number)));
writeFileSync(target, template);
console.log(`초안 생성: ${fileURLToPath(target)}`);
