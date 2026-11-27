import { pageMeta } from '../lib/meta';

export const metadata = pageMeta({ title: '페이지를 찾을 수 없음', noindex: true });

export default function NotFound() {
  return (
    <>
      <h1>페이지를 찾을 수 없습니다</h1>
      <p>주소가 바뀌었거나 아직 풀이가 공개되지 않은 문항입니다.</p>
      <p>
        <a className="btn primary" href="/">
          시험 목록으로
        </a>
      </p>
    </>
  );
}
