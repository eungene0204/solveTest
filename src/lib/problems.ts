import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { problemId, problemPath, problemTitle, type Exam } from './exams';
import type { IndexEntry } from './query';
import { problemSchema, type ProblemData } from './schema';

/** 문항 하나. id는 파일명(확장자 제외)이다: content/problems/2027-suneung-math-22.yaml → 2027-suneung-math-22 */
export interface Problem {
  id: string;
  data: ProblemData;
}

/** `npm run dev` 와 `npm run build:preview` 에서 켜진다. 초안이 보이고 전체 페이지가 noindex가 된다. */
export const PREVIEW = process.env.PREVIEW === 'true';

const CONTENT_DIR = path.join(process.cwd(), 'content/problems');

/** 문항 하나당 YAML 파일 하나. 밑줄로 시작하는 파일은 무시한다. 스키마 검사에 실패하면 빌드를 멈춘다(ADR 0002). */
function loadProblems(): Problem[] {
  const files = readdirSync(CONTENT_DIR, { recursive: true, encoding: 'utf8' }).filter(
    (f) => f.endsWith('.yaml') && !path.basename(f).startsWith('_'),
  );
  const list = files.map((file) => {
    const id = file.replace(/\.yaml$/, '');
    const raw = parse(readFileSync(path.join(CONTENT_DIR, file), 'utf8'));
    const result = problemSchema.safeParse(raw);
    if (!result.success) {
      const issues = result.error.issues.map((i) => `  - ${i.path.join('.') || '(문항)'}: ${i.message}`).join('\n');
      throw new Error(`content/problems/${file} 검사 실패:\n${issues}`);
    }
    const expected = problemId(result.data.exam, result.data.number);
    if (id !== expected) throw new Error(`파일명 ${id}.yaml 이 내용(${expected})과 맞지 않습니다.`);
    return { id, data: result.data };
  });
  return list.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
}

let cache: Problem[] | undefined;

export function allProblems(): Problem[] {
  // 개발 서버에서는 YAML 수정이 바로 보이도록 매번 읽는다.
  if (process.env.NODE_ENV === 'development') return loadProblems();
  return (cache ??= loadProblems());
}

/** 목록·검색·관련 문항·앞뒤 이동에 나오는 문항 */
export const isListed = (p: Problem) => p.data.status === 'published' || (PREVIEW && p.data.status === 'draft');

/** 페이지가 생성되는 문항. 공개 중지된 문항은 공유된 주소를 살리기 위해 '수정 중' 페이지로 남긴다. */
export const hasPage = (p: Problem) => isListed(p) || p.data.status === 'withdrawn';

export const urlOf = (p: Problem) => problemPath(p.data.exam, p.data.number);
export const titleOf = (p: Problem) => problemTitle(p.data.exam, p.data.number);

export function inExam(list: Problem[], exam: Exam) {
  return list.filter(
    (p) => p.data.exam.year === exam.year && p.data.exam.kind === exam.kind && p.data.exam.subject === exam.subject,
  );
}

export function toIndexEntry(p: Problem): IndexEntry {
  return {
    id: p.id,
    year: p.data.exam.year,
    kind: p.data.exam.kind,
    number: p.data.number,
    url: urlOf(p),
    title: titleOf(p),
    concepts: p.data.concepts.map((c) => c.label),
  };
}

/** 문제 그림: src/figures/<이름>.svg 원문 (currentColor라 다크 모드에서도 보인다). */
export function figureSvg(name: string): string {
  if (!/^[\w-]+$/.test(name)) throw new Error(`잘못된 그림 이름: ${name}`);
  try {
    return readFileSync(path.join(process.cwd(), 'src/figures', `${name}.svg`), 'utf8');
  } catch {
    throw new Error(`src/figures/${name}.svg 없음`);
  }
}
