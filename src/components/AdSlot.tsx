'use client';

/**
 * 광고 자리. 검수·공개된 문항 페이지의 풀이 아래 한 곳에서만 렌더링한다.
 * 검색, 준비 중, 오류, 수정 중, 미리보기 화면에는 넣지 않는다.
 * 광고 사업자의 콘텐츠·배치·개인정보 조건을 확인한 뒤 환경변수(PUBLIC_ADSENSE_CLIENT, PUBLIC_ADSENSE_SLOT)를 채워 활성화한다.
 * 노출 여부는 문항 페이지(서버)에서 판단하고, 이 컴포넌트는 켜졌을 때만 쓰인다.
 */
import Script from 'next/script';
import { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdSlot({ client, slot }: { client: string; slot: string }) {
  useEffect(() => {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  }, []);
  return (
    <aside className="ad-slot" aria-label="광고">
      <Script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
