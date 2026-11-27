# 설계 (아키텍처)

코드가 어떻게 짜여 있고 데이터가 어떻게 흐르는지. 요구사항은 `docs/prd.md`, 결정 이유는 `docs/adr/`.

## 한눈에

```
content/problems/*.yaml ──┐
src/figures/*.svg ────────┤   Next.js 정적 export        정적 호스팅
src/lib/exams.ts ─────────┼──▶  zod 스키마 검사   ──▶  out/   ──▶  (서버·DB 없음)
                          │     공개 조건 검사
                          │     KaTeX 서버 렌더링
                          └──   페이지 생성
```

모든 콘텐츠는 저장소 안의 파일이다. 빌드가 곧 검수 게이트이며, 런타임에 서버가 하는 일은 없다(오류 신고 수신만 외부 엔드포인트).

## 빌드 모드

| 명령 | `PREVIEW` | 페이지 대상 | 검색 노출 |
| - | - | - | - |
| `npm run dev` | true | 초안 + 공개 + 공개 중지 | 전부 noindex |
| `npm run build:preview` | true | 같음 (휴대전화 검수용 배포) | 전부 noindex, robots 전체 차단 |
| `npm run build` | false | 공개 + 공개 중지 | 공개 문항만 색인·사이트맵 |

배포 빌드에서 **초안은 페이지 자체가 생기지 않는다.** 미리보기 모드에서만 공개 전 확인 항목 배너가 보인다.

## 디렉터리

| 위치 | 역할 |
| - | - |
| `content/problems/<id>.yaml` | 문항 하나 = 파일 하나. id = `<학년도>-<시험>-<과목>-<번호>` |
| `src/lib/schema.ts` | 문항 스키마, 검수 단계, **`publishBlockers`(공개 조건의 유일한 기준)** |
| `src/lib/exams.ts` | 회차 등록부: 문항 수, 공식 문제지·정답표 링크, 이용 조건 기록(`rights`), 주소·제목 헬퍼 |
| `src/lib/problems.ts` | YAML을 읽어 `problemSchema`로 검증(실패 시 빌드 중단), 목록 노출(`isListed`)·페이지 생성(`hasPage`) 규칙, 그림 SVG 읽기 |
| `src/lib/meta.ts` | 페이지 `<head>` 메타데이터(`pageMeta`): 제목, canonical, noindex(미리보기는 전부) |
| `src/lib/query.ts` | 검색어 해석(NFKC, 연도·시험·번호 표현)과 검색 |
| `src/lib/markdown.ts` | 마크다운 + KaTeX 렌더링. 수식 오류는 빌드 실패 |
| `src/lib/track.ts` | 측정 이벤트(dataLayer). 두 번째 문항 열람 판정 |
| `src/figures/<id>.svg` | 문제 그림. 문항 페이지에 인라인으로 삽입 |
| `src/app/layout.tsx` | 공통 머리글·바닥글, KaTeX·전역 CSS, 측정 시작 |
| `src/app/[kind]/[year]/[subject]/[[...number]]/` | `page.tsx`가 주소를 보고 `ExamView`(회차 문항 목록) 또는 `ProblemView`(문항 페이지)로 나눈다 |
| `src/app/search/` | 검색. 색인은 빌드 시 페이지에 넣고 `SearchResults`(클라이언트)가 `?q=`를 해석 |
| `src/app/sitemap.ts`, `robots.ts`, `not-found.tsx` | 공개 문항 기준 사이트맵, 모드별 robots, 404 |
| `src/components/` | `ReportForm`·`AdSlot`·`Tracking`·`OpenSolutionOnHash`(클라이언트), `SearchForm` |
| `scripts/` | 초안 생성(`new`), 원문 대조 이미지 생성(`crop`, macOS PDFKit) |
| `tests/` | 검색어 해석, 공개 조건 (Vitest) |

## 데이터 모델 (문항)

필드 정의와 주석은 `src/lib/schema.ts`가 원본이다. 주요 묶음:

- **식별**: `exam {year, kind, subject, part}`, `number`, `paperType`(odd/even), `paperPage`
- **문제 본문**: `problem {body, figure?, conditions?, boxTitle?, middle?, conditions2?, after?, choices?}` → 화면 순서도 이 순서
- **정답**: `format`(choice/short), `answer {value, choice?, choiceOtherPaper?}`
- **해설**: `hint`, `firstIdea`, `steps[] {title, body, why}`, `pitfalls[]`, `concepts[]`(2015·2022 과목명), `related[]`
- **운영**: `status`(draft/published/withdrawn), `difficulty`, `reviews[]`, `changelog[]`, `minutes`

## 공개 조건 (게이트)

`publishBlockers(p)`가 사유 목록을 돌려준다. `status: published`면 스키마의 `superRefine`이 이 목록을 빌드 오류로 바꾸고, 미리보기에서는 같은 목록을 배너로 보여준다. 검사 항목:

- 검수 기록: 정답 대조, 풀이 검수, 모바일 미리보기 (+ 고난도는 독립 재풀이)
- 회차 등록 여부, 회차의 공식 문제지 링크, 번호 범위
- 형식 일관성: 선택형의 정답 번호·선택지 5개, 정답 값과 해당 선택지 일치
- 문제 본문 존재, 본문·해설에 TODO 없음, 수정 기록 존재

## 문항 페이지 구성

출처(제목·메타) → **문제 본문** → 공식 문제지·정답표 링크 → 개념 태그 → 힌트(접힘) → 풀이(접힘, 첫 발상 → 단계) → 정답(접힘) → 자주 틀리는 지점 → 광고 → 관련 기출 → 앞뒤 문항 → 오류 신고 → 검수·수정 기록.
공개 중지 문항은 같은 주소에 “수정 중” 안내만 남기고 해설·광고를 숨긴다.

## 외부 연결 (환경변수, `.env.example`)

| 변수 | 용도 | 현재 |
| - | - | - |
| `SITE_URL` | canonical, 사이트맵 | 미정 (example.com) |
| `PUBLIC_REPORT_ENDPOINT` | 오류 신고 POST(JSON) 수신처 | 미정 → 신고 폼은 “준비 중” |
| `PUBLIC_ADSENSE_CLIENT`, `PUBLIC_ADSENSE_SLOT` | 광고 | 미설정 → 광고 없음 |

분석 도구는 아직 없다. `track.ts`는 `window.dataLayer`에 이벤트를 쌓기만 한다.

## 확장 지점

- **새 회차**: `exams.ts`의 `EXAMS`에 추가 → `npm run new -- <학년도> <번호>`.
- **새 시험 종류·과목**: `EXAM_KINDS`/`SUBJECTS`/`PARTS`와 라벨, `query.ts`의 시험 표현을 함께 확장.
- **선택과목·2028 체제**: `part`와 개념 태그의 `course2022`로 구분한다.
