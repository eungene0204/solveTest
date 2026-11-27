import type { MetadataRoute } from 'next';
import { EXAMS, examPath } from '../lib/exams';
import { SITE_URL } from '../lib/meta';
import { allProblems, inExam, urlOf } from '../lib/problems';

export const dynamic = 'force-static';

// 공개·검수된 문항과, 그런 문항이 하나 이상 있는 회차만 넣는다. 미리보기 빌드에서도 초안은 넣지 않는다.
export default function sitemap(): MetadataRoute.Sitemap {
  const published = allProblems().filter((p) => p.data.status === 'published');
  const lastmod = (dates: Date[]) => (dates.length ? [...dates].sort((a, b) => +b - +a)[0].toISOString().slice(0, 10) : undefined);
  const url = (loc: string, lastModified?: string) => ({ url: new URL(loc, SITE_URL).href, lastModified });

  const out: MetadataRoute.Sitemap = [url('/')];
  for (const exam of EXAMS) {
    const ps = inExam(published, exam);
    if (ps.length) out.push(url(examPath(exam), lastmod(ps.flatMap((p) => p.data.changelog.map((c) => c.date)))));
  }
  for (const p of published) out.push(url(urlOf(p), lastmod(p.data.changelog.map((c) => c.date))));
  return out;
}
