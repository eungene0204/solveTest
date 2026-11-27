import type { APIRoute } from 'astro';
import { PREVIEW } from '../lib/problems';

export const GET: APIRoute = ({ site }) =>
  new Response(
    PREVIEW
      ? 'User-agent: *\nDisallow: /\n'
      : `User-agent: *\nDisallow: /search/\nSitemap: ${new URL('/sitemap.xml', site)}\n`,
    { headers: { 'content-type': 'text/plain; charset=utf-8' } },
  );
