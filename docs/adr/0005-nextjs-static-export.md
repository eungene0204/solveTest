# Astro 5 대신 Next.js 정적 export

ADR 0001의 정적 사이트를 Astro 5에서 Next.js 16(App Router, `output: 'export'`)으로 옮겼다. 사용자가 Next.js를 쓰기로 결정했다. ADR 0001의 근거는 정적 export로도 그대로 지킨다. 서버·DB 없이 `out/` 정적 파일만 만들고, 문항은 저장소의 YAML 파일이며, 수식은 빌드 시점에 KaTeX HTML로 렌더링한다.

## Consequences

- 주소, 페이지 구성, `<head>`, robots, sitemap은 Astro 시절과 같다(`trailingSlash: true`). 전환할 때 미리보기 빌드 26쪽의 본문 HTML이 Astro 결과와 같은지 대조했다.
- 콘텐츠 로딩은 Astro content layer 대신 `src/lib/problems.ts`가 직접 한다(`yaml` + zod 3). 스키마 위반과 `publishBlockers`는 여전히 빌드를 멈춘다(ADR 0002).
- `generateStaticParams()`가 빈 배열이면 정적 export 빌드가 실패한다. 공개 문항이 0개인 공개 빌드도 통과하도록 회차 목록과 문항 페이지를 `[kind]/[year]/[subject]/[[...number]]` 하나로 묶었다.
- 검색 결과는 `useSearchParams`로 브라우저에서 채운다. 정적 HTML에는 빈 검색창만 있다(Astro 때와 같음).
- 환경변수 이름(`PUBLIC_*`)은 그대로다. 서버 컴포넌트가 빌드 시점에 읽어 클라이언트 컴포넌트에 넘긴다.
- 사이트 안 링크는 `next/link`가 아닌 일반 `<a>`다. 페이지마다 측정 스크립트가 새로 실행되는 동작을 Astro 때와 같게 두기 위해서다.
- Next의 클라이언트 런타임(React)이 더해져 문항 페이지가 내려받는 JS가 약 4KB(Astro)에서 약 580KB(gzip 약 180KB)로 늘었다. 본문은 정적 HTML이라 JS 없이도 읽힌다. 모바일 첫 로딩이 문제가 되면 이 항목부터 다시 본다.
- `next dev`가 `CLAUDE.md`(= `AGENTS.md`) 끝에 Next.js 에이전트 안내 블록을 넣는다. 지우면 다시 생기므로 그대로 둔다.
