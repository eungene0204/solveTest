import { describe, expect, it } from 'vitest';
import { parseQuery, search, type IndexEntry } from '../src/lib/query';

describe('parseQuery', () => {
  const same = { year: 2027, kind: 'suneung', number: 22 };
  it.each([
    '2027 수능 22번',
    '2027학년도 수능 수학 22번',
    '2027학년도 대학수학능력시험 수학 22번',
    '27수능 22번',
    "'27 수능 22",
    '27학년도 수능 22',
    '수능 2027 22',
    '22번 2027 수능',
    '２０２７ 수능 ２２번',
  ])('%s → 2027 수능 22번', (q) => {
    expect(parseQuery(q)).toEqual(same);
  });

  it('모의평가 표기', () => {
    expect(parseQuery('2026 6월 모의평가 15번')).toEqual({ year: 2026, kind: 'june', number: 15 });
    expect(parseQuery('26 9모 21')).toEqual({ year: 2026, kind: 'sept', number: 21 });
    expect(parseQuery('2026 9평 3번')).toEqual({ year: 2026, kind: 'sept', number: 3 });
  });

  it('일부만 있는 검색어', () => {
    expect(parseQuery('2027 수능')).toEqual({ year: 2027, kind: 'suneung' });
    expect(parseQuery('수능 14번')).toEqual({ kind: 'suneung', number: 14 });
    expect(parseQuery('정적분')).toEqual({});
  });

  it('범위를 벗어난 번호는 무시', () => {
    expect(parseQuery('2027 수능 45번')).toEqual({ year: 2027, kind: 'suneung' });
  });
});

describe('search', () => {
  const e = (year: number, number: number, concepts: string[] = []): IndexEntry => ({
    id: `${year}-suneung-math-${number}`, year, kind: 'suneung', number,
    url: `/suneung/${year}/math/${number}/`, title: `${year}학년도 수능 수학 ${number}번`, concepts,
  });
  const index = [e(2027, 22, ['정적분']), e(2027, 21), e(2026, 22)];

  it('학년도+번호는 한 문항을 가리킨다', () => {
    const r = search('2027 수능 22번', index);
    expect(r.specific).toBe(true);
    expect(r.results.map((x) => x.id)).toEqual(['2027-suneung-math-22']);
  });
  it('번호만 주면 여러 학년도', () => {
    expect(search('22번', index).results).toHaveLength(2);
  });
  it('개념어 검색', () => {
    expect(search('정적분', index).results.map((x) => x.number)).toEqual([22]);
  });
});
