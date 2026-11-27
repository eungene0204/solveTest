import { notFound } from 'next/navigation';
import { EXAMS, examPath, examTitle } from '../../../../../lib/exams';
import { pageMeta } from '../../../../../lib/meta';
import { allProblems, inExam, isListed, urlOf } from '../../../../../lib/problems';

export type ExamParams = { kind: string; year: string; subject: string };

export function examStaticParams(): ExamParams[] {
  return EXAMS.map((exam) => ({ kind: exam.kind, year: String(exam.year), subject: exam.subject }));
}

function load(params: ExamParams) {
  const exam = EXAMS.find((e) => e.kind === params.kind && String(e.year) === params.year && e.subject === params.subject);
  if (!exam) notFound();
  const listed = inExam(allProblems().filter(isListed), exam);
  const publishedCount = listed.filter((p) => p.data.status === 'published').length;
  return { exam, listed, publishedCount, title: examTitle(exam) };
}

export function examMetadata(params: ExamParams) {
  const { exam, publishedCount, title } = load(params);
  return pageMeta({
    title: `${title} 공통 풀이`,
    description: `${title} 공통 1~${exam.count}번 힌트와 단계별 풀이`,
    path: examPath(exam),
    noindex: publishedCount === 0,
  });
}

export default function ExamView({ params }: { params: ExamParams }) {
  const { exam, listed, publishedCount, title } = load(params);
  const byNumber = new Map(listed.map((p) => [p.data.number, p]));
  return (
    <>
      <nav className="crumbs">
        <a href="/">시험 목록</a>
      </nav>
      <h1>{title} 공통</h1>
      <p className="muted small">
        풀이 공개 {publishedCount}/{exam.count}문항
        {exam.paperUrl && (
          <>
            {' · '}
            <a href={exam.paperUrl} target="_blank" rel="noopener">
              공식 문제지 ↗
            </a>
          </>
        )}
      </p>
      <ul className="grid">
        {Array.from({ length: exam.count }, (_, i) => i + 1).map((n) => {
          const p = byNumber.get(n);
          return (
            <li key={n}>
              {p ? (
                <a
                  href={urlOf(p)}
                  className={p.data.status === 'draft' ? 'draft' : undefined}
                  title={p.data.concepts.map((c) => c.label).join(', ')}
                >
                  {n}
                </a>
              ) : (
                <span title="준비 중">{n}</span>
              )}
            </li>
          );
        })}
      </ul>
      <p className="small muted">점선 번호는 풀이를 준비하고 있는 문항입니다.</p>
    </>
  );
}
