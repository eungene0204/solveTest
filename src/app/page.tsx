import SearchForm from '../components/SearchForm';
import { EXAMS, examPath, examTitle } from '../lib/exams';
import { pageMeta } from '../lib/meta';
import { allProblems, inExam, isListed } from '../lib/problems';
import { SITE_NAME } from '../site';

export const metadata = pageMeta({ title: SITE_NAME, path: '/' });

export default function Home() {
  const listed = allProblems().filter(isListed);
  const exams = [...EXAMS].sort((a, b) => b.year - a.year);
  return (
    <>
      <h1>막힌 기출, 첫 발상부터</h1>
      <p className="muted">학년도와 문항 번호로 찾으면 힌트와 검수된 풀이를 바로 볼 수 있습니다. 회원가입은 필요 없습니다.</p>

      <SearchForm style={{ margin: '16px 0 8px' }} />

      <h2>시험 목록</h2>
      <ul className="stack" style={{ listStyle: 'none', padding: 0 }}>
        {exams.map((exam) => {
          const n = inExam(listed, exam).filter((p) => p.data.status === 'published').length;
          return (
            <li className="card" key={examPath(exam)}>
              <a href={examPath(exam)}>
                <strong>{examTitle(exam)} 공통</strong>
              </a>
              <div className="small muted">
                풀이 공개 {n}/{exam.count}문항
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
