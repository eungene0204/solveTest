// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // 실제 도메인이 정해지면 SITE_URL 환경변수로 지정한다. canonical·사이트맵에 쓰인다.
  site: process.env.SITE_URL ?? 'https://example.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
