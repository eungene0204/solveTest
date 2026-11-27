# 기출풀이 (가칭)

수험생이 막힌 기출문항을 검색해 힌트와 검수된 풀이를 바로 보는 무료·무로그인 정적 사이트. 첫 범위는 2025~2027학년도 수능 수학 공통 66문항. 사용자와의 대화·문서·커밋 메시지는 한국어로 쓴다.

## 문서 지도

작업 전에 해당하는 문서를 읽는다.

- **무엇을 만드나·범위 판단** → `docs/prd.md` (요구사항 ID: FR-xx, NFR-xx)
- **코드 구조·데이터 흐름** → `docs/architecture.md`
- **"왜 이렇게 했지?"** → `docs/adr/` (뒤집기 전에 반드시 읽는다)
- **용어** → `GLOSSARY.md` (회차, 문항, 홀수형, 첫 발상, 공개 조건…)
- **해설·문제 본문 작성, 발행 흐름** → `docs/content-guide.md`
- **지금 어느 단계인가·다음 할 일** → `docs/roadmap.md`, 파일럿 세부는 `docs/pilot.md`, 사람 검수는 `docs/review-sheet.md`

명령은 `package.json` scripts가 기준이다.

## 작업 규칙

- **완료 기준**: `npm test`, `npm run check`, `npm run build:preview`, `npm run build` 네 개가 모두 통과하고, 바꾼 문항 페이지를 375px 폭에서 확인해 가로 넘침이 없어야 끝난 것이다.
- **문항 콘텐츠**: `content/problems/<id>.yaml` 한 파일이 한 문항이다. 공개 조건은 `src/lib/schema.ts`의 `publishBlockers`가 유일한 기준이며, 조건을 우회하지 말고 빠진 검수 기록을 채운다.
- **검수 기록의 주체**: `reviews`의 `by`에는 실제로 그 검수를 한 주체를 적는다. Claude가 한 것은 `answer-check`(공식 정답표 대조)까지이고, `solution-review`·`independent-resolve`·`mobile-preview`는 사람이 한다.
- **문제 본문**: 원문을 그대로 옮겨 적고(`problem` 필드), 그래프는 `src/figures/<id>.svg`로 다시 그린다. 캡처 이미지는 화면에 쓰지 않는다(ADR 0003).
- **긴 별도 줄 수식**: 375px에서 넘치면 `aligned`로 나눈다.
- **정답이 의심되면** 즉시 사용자에게 알리고, 공개된 문항이면 `status: withdrawn`을 제안한다.

## 함정

- 스키마(`src/lib/schema.ts`)를 바꾼 뒤 dev 서버가 새 필드를 버리면 서버를 끄고 `.astro/data-store.json`을 지운 뒤 다시 켠다.
- Astro는 의도적으로 5.x다. 메이저 업그레이드는 사용자 요청이 있을 때만.
- 평가원 정답표 링크는 공개 가채점본이다. 확정 정답 발표 후 재대조가 필요하다(`docs/roadmap.md`).
- 평가원에 이용 허락 문의는 하지 않기로 했다. 다시 제안하지 않는다.
