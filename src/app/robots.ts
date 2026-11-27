import type { MetadataRoute } from 'next';
import { SITE_URL } from '../lib/meta';
import { PREVIEW } from '../lib/problems';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return PREVIEW
    ? { rules: { userAgent: '*', disallow: '/' } }
    : { rules: { userAgent: '*', disallow: '/search/' }, sitemap: new URL('/sitemap.xml', SITE_URL).href };
}
