import type { APIRoute } from 'astro';
import { allProblems, inExam, urlOf } from '../lib/problems';
import { EXAMS, examPath } from '../lib/exams';

// 공개·검수된 문항과, 그런 문항이 하나 이상 있는 회차만 넣는다. 미리보기 빌드에서도 초안은 넣지 않는다.
export const GET: APIRoute = async ({ site }) => {
  const published = (await allProblems()).filter((p) => p.data.status === 'published');
  const lastmod = (dates: Date[]) => (dates.length ? dates.sort((a, b) => +b - +a)[0].toISOString().slice(0, 10) : undefined);

  const urls: { loc: string; lastmod?: string }[] = [{ loc: '/' }];
  for (const exam of EXAMS) {
    const ps = inExam(published, exam);
    if (ps.length) urls.push({ loc: examPath(exam), lastmod: lastmod(ps.flatMap((p) => p.data.changelog.map((c) => c.date))) });
  }
  for (const p of published) urls.push({ loc: urlOf(p), lastmod: lastmod(p.data.changelog.map((c) => c.date)) });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${new URL(u.loc, site)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
