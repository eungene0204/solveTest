import { describe, expect, it } from 'vitest';
import { problemFields, problemSchema, publishBlockers } from '../src/lib/schema';

const base = {
  exam: { year: 2027, kind: 'suneung', subject: 'math', part: 'common' },
  number: 22,
  format: 'short',
  answer: { value: '13' },
  status: 'published',
  difficulty: 'standard',
  concepts: [{ label: '정적분', course2015: '수학Ⅱ', course2022: '미적분Ⅰ' }],
  hint: '힌트',
  firstIdea: '근거',
  steps: [{ title: '1단계', body: '본문', why: '이유' }],
  pitfalls: ['주의'],
  problem: { body: '문제 본문 [4점]' },
  reviews: [
    { step: 'answer-check', by: 'a', date: '2026-11-27' },
    { step: 'solution-review', by: 'b', date: '2026-11-27' },
    { step: 'mobile-preview', by: 'a', date: '2026-11-27' },
  ],
  changelog: [{ date: '2026-11-27', note: '최초 공개' }],
};

describe('공개 조건', () => {
  it('모든 단계를 마친 문항은 공개 가능', () => {
    expect(problemSchema.safeParse(base).success).toBe(true);
  });
  it('검수 기록이 빠지면 공개 불가', () => {
    const r = problemSchema.safeParse({ ...base, reviews: base.reviews.slice(0, 1) });
    expect(r.success).toBe(false);
  });
  it('고난도는 독립 재풀이가 필요', () => {
    const p = problemFields.parse({ ...base, difficulty: 'hard' });
    expect(publishBlockers(p)).toEqual(['독립 재풀이 기록 없음']);
  });
  it('선택형은 선택지 번호가 필요', () => {
    const p = problemFields.parse({ ...base, format: 'choice' });
    expect(publishBlockers(p)).toContain('선택형인데 정답 선택지 번호(answer.choice) 없음');
  });
  it('TODO가 남으면 공개 불가', () => {
    const p = problemFields.parse({ ...base, hint: 'TODO: 힌트' });
    expect(publishBlockers(p)).toContain('본문에 TODO가 남아 있음');
  });
  it('문제지 링크가 없는 회차는 공개 불가', () => {
    const p = problemFields.parse({ ...base, exam: { ...base.exam, year: 2026 } });
    expect(publishBlockers(p)).toContain('회차의 공식 문제지 링크(paperUrl) 없음');
  });
  it('문제 본문이 없으면 공개 불가', () => {
    const { problem: _, ...rest } = base;
    const p = problemFields.parse(rest);
    expect(publishBlockers(p)).toContain('문제 본문(problem) 없음');
  });
  it('정답 값과 정답 번호 선택지가 다르면 공개 불가', () => {
    const choices = ['$\\dfrac{11}{4}$', '3', '$\\dfrac{13}{4}$', '$\\dfrac{7}{2}$', '$\\dfrac{15}{4}$'];
    const ok = problemFields.parse({ ...base, format: 'choice', answer: { value: '\\frac{7}{2}', choice: 4 }, problem: { body: '문제', choices } });
    expect(publishBlockers(ok)).toEqual([]);
    const bad = problemFields.parse({ ...base, format: 'choice', answer: { value: '\\frac{7}{2}', choice: 3 }, problem: { body: '문제', choices } });
    expect(publishBlockers(bad).some((m) => m.includes('3번 선택지'))).toBe(true);
  });
  it('초안은 조건을 검사하지 않는다', () => {
    expect(problemSchema.safeParse({ ...base, status: 'draft', reviews: [] }).success).toBe(true);
  });
});
