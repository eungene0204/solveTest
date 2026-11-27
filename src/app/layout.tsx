import 'katex/dist/katex.min.css';
import '../styles/global.css';
import type { Metadata, Viewport } from 'next';
import SearchForm from '../components/SearchForm';
import Tracking from '../components/Tracking';
import { pageMeta, SITE_URL } from '../lib/meta';
import { PREVIEW } from '../lib/problems';
import { SITE_NAME } from '../site';

export const metadata: Metadata = { metadataBase: new URL(SITE_URL), ...pageMeta({ title: SITE_NAME }) };
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header className="site-header">
          <div className="wrap">
            <a className="brand" href="/">
              {SITE_NAME}
              {PREVIEW && (
                <span className="small" style={{ color: 'var(--warn)' }}>
                  {' '}
                  미리보기
                </span>
              )}
            </a>
            <SearchForm button="검색" primary={false} />
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer>
          <div className="wrap">
            문제는 각 시행기관(한국교육과정평가원 등)의 시험 문항을 옮겨 적은 것으로 저작권은 시행기관에 있습니다. 힌트와 풀이는 자체
            작성했습니다. 해설 오류는 각 문항 페이지 하단에서 신고할 수 있습니다.
          </div>
        </footer>
        <Tracking />
      </body>
    </html>
  );
}
