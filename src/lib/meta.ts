import type { Metadata } from 'next';
import { SITE_DESCRIPTION, SITE_NAME } from '../site';
import { PREVIEW } from './problems';

/** 실제 도메인이 정해지면 SITE_URL 환경변수로 지정한다. canonical·사이트맵에 쓰인다. */
export const SITE_URL = process.env.SITE_URL ?? 'https://example.com';

interface PageMeta {
  title: string;
  description?: string;
  /** 사이트 안 경로 (끝에 / 포함). canonical·og:url에 쓰인다. */
  path?: string;
  /** 검색 노출 제외 (준비 중·오류·수정 중 페이지). 미리보기 빌드는 전부 noindex. */
  noindex?: boolean;
}

/** 모든 페이지의 <head> 메타데이터. 페이지마다 generateMetadata/metadata에서 이것만 쓴다. */
export function pageMeta({ title, description = SITE_DESCRIPTION, path, noindex = false }: PageMeta): Metadata {
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  const canonical = path ? new URL(path, SITE_URL).href : undefined;
  return {
    title: { absolute: fullTitle },
    description,
    alternates: canonical ? { canonical } : undefined,
    robots: noindex || PREVIEW ? { index: false, follow: false } : undefined,
    openGraph: { title: fullTitle, description, url: canonical, type: 'article' },
  };
}
