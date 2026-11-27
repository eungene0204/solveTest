import type { NextConfig } from 'next';

// 서버 없이 정적 파일만 만든다(ADR 0001, 0005). 결과물은 out/ 에 생긴다.
const nextConfig: NextConfig = {
  output: 'export',
  // /suneung/2027/math/22/ 처럼 끝에 /가 붙은 주소와 디렉터리별 index.html. Astro 시절 주소와 같다.
  trailingSlash: true,
};

export default nextConfig;
