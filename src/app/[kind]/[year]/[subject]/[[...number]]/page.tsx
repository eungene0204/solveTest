/**
 * /{시험}/{학년도}/{과목}/      → 회차 문항 목록 (ExamView)
 * /{시험}/{학년도}/{과목}/{번호}/ → 문항 페이지 (ProblemView)
 *
 * 두 화면을 선택적 catch-all 하나로 묶은 이유: `output: 'export'` 에서는 generateStaticParams가
 * 빈 배열이면 빌드가 실패한다. 공개 문항이 0개인 시기(공개 빌드)에도 회차 목록은 항상 있으므로
 * 한 경로로 합치면 이 제약에 걸리지 않는다(ADR 0005).
 */
import { notFound } from 'next/navigation';
import ExamView, { examMetadata, examStaticParams } from './ExamView';
import ProblemView, { problemMetadata, problemStaticParams } from './ProblemView';

type Params = { kind: string; year: string; subject: string; number?: string[] };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return [
    ...examStaticParams().map((p) => ({ ...p, number: [] })),
    ...problemStaticParams().map(({ number, ...p }) => ({ ...p, number: [number] })),
  ];
}

function route({ number = [], ...rest }: Params) {
  if (number.length === 0) return { kind: 'exam' as const, params: rest };
  if (number.length === 1) return { kind: 'problem' as const, params: { ...rest, number: number[0] } };
  notFound();
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const r = route(await params);
  return r.kind === 'exam' ? examMetadata(r.params) : problemMetadata(r.params);
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const r = route(await params);
  return r.kind === 'exam' ? <ExamView params={r.params} /> : <ProblemView params={r.params} />;
}
