import { getCollection, type CollectionEntry } from 'astro:content';
import { problemId, problemPath, problemTitle, type Exam } from './exams';
import type { IndexEntry } from './query';

export type Problem = CollectionEntry<'problems'>;

/** `npm run dev` 와 `npm run build:preview` 에서 켜진다. 초안이 보이고 전체 페이지가 noindex가 된다. */
export const PREVIEW = process.env.PREVIEW === 'true';

export async function allProblems(): Promise<Problem[]> {
  const list = await getCollection('problems');
  for (const p of list) {
    const expected = problemId(p.data.exam, p.data.number);
    if (p.id !== expected) throw new Error(`파일명 ${p.id}.yaml 이 내용(${expected})과 맞지 않습니다.`);
  }
  return list.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
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
