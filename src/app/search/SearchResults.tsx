'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import SearchForm from '../../components/SearchForm';
import { KIND_LABEL, type ExamKind } from '../../lib/exams';
import { search, type IndexEntry } from '../../lib/query';
import { track } from '../../lib/track';

export type ExamInfo = { year: number; kind: ExamKind; count: number; paperUrl: string | null };

export default function SearchResults({ index, exams }: { index: IndexEntry[]; exams: ExamInfo[] }) {
  const q = useSearchParams().get('q') ?? '';
  const r = useMemo(() => (q.trim() ? search(q, index) : null), [q, index]);
  // 문항 하나를 정확히 가리키면 바로 이동한다.
  const redirect = r && r.specific && r.results.length === 1 ? r.results[0].url : null;

  useEffect(() => {
    if (!r) return;
    track('search', { results: r.results.length });
    if (redirect) location.replace(redirect);
  }, [r, redirect]);

  return (
    <>
      <SearchForm id="q" key={q} defaultValue={q} style={{ marginBottom: 16 }} />
      <div id="out" aria-live="polite">
        {r && !redirect && <Results r={r} exams={exams} />}
      </div>
    </>
  );
}

function Results({ r, exams }: { r: ReturnType<typeof search>; exams: ExamInfo[] }) {
  if (r.results.length > 0) {
    return (
      <>
        <p className="muted small">{r.results.length}개 문항</p>
        <ul className="stack" style={{ listStyle: 'none', padding: 0 }}>
          {r.results.map((e) => (
            <li className="card" key={e.id}>
              <a href={e.url}>{e.title}</a>
              <div className="small muted">{e.concepts.join(' · ')}</div>
            </li>
          ))}
        </ul>
      </>
    );
  }
  if (r.specific) {
    // 아직 풀이가 없는 문항: 준비 중 안내와 공식 문제지 링크
    const exam = exams.find((e) => e.year === r.parsed.year && (!r.parsed.kind || e.kind === r.parsed.kind));
    const label = `${r.parsed.year}학년도 ${KIND_LABEL[r.parsed.kind ?? 'suneung']} 수학 ${r.parsed.number}번`;
    if (!exam) return <p>{label}는 아직 지원하지 않는 시험입니다.</p>;
    return (
      <div className="card">
        <p>
          <strong>{label}</strong> 풀이는 준비 중입니다.
        </p>
        {exam.paperUrl && (
          <a className="btn" href={exam.paperUrl} target="_blank" rel="noopener">
            공식 문제지 ↗
          </a>
        )}
      </div>
    );
  }
  return (
    <p>
      검색 결과가 없습니다. <span className="muted">‘2027 수능 22번’처럼 학년도와 번호로 찾아보세요.</span>
    </p>
  );
}
