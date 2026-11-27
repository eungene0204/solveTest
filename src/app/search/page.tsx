import { Suspense } from 'react';
import SearchForm from '../../components/SearchForm';
import { EXAMS } from '../../lib/exams';
import { pageMeta } from '../../lib/meta';
import { allProblems, isListed, toIndexEntry } from '../../lib/problems';
import SearchResults, { type ExamInfo } from './SearchResults';

export const metadata = pageMeta({ title: '문항 검색', path: '/search/', noindex: true });

export default function SearchPage() {
  // 색인은 빌드 시점에 페이지에 넣고, 검색어 해석은 브라우저에서 한다.
  const index = allProblems().filter(isListed).map(toIndexEntry);
  const exams: ExamInfo[] = EXAMS.map((e) => ({ year: e.year, kind: e.kind, count: e.count, paperUrl: e.paperUrl ?? null }));
  return (
    <>
      <h1>문항 검색</h1>
      {/* 정적 HTML에는 빈 검색창이 들어가고, 브라우저에서 ?q= 를 읽어 결과를 채운다. */}
      <Suspense fallback={<SearchForm id="q" style={{ marginBottom: 16 }} />}>
        <SearchResults index={index} exams={exams} />
      </Suspense>
    </>
  );
}
