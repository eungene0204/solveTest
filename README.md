# 기출풀이 (가칭)

막힌 기출문항을 검색하면 회원가입 없이 힌트와 검수된 풀이를 바로 보는 무료 웹 서비스.
첫 출시 범위: 2025~2027학년도 수능 수학 공통 66문항.

## 실행

```sh
npm install
npm run dev            # 미리보기 모드: 초안까지 보임, 공개 전 확인 항목 배너 표시
npm run build          # 배포 빌드: 공개(published) 문항만. 공개 조건 미충족 시 실패
npm run build:preview  # 초안 포함 정적 빌드 (모바일 검수용 배포, 전체 noindex)
npm run new -- 2027 22 # 초안 파일 생성
npm run crop           # 원문 대조용 문항 이미지 → .cache/crops/ (macOS, 화면에는 안 씀)
npm test               # 검색어 해석·공개 조건 테스트
npm run check          # 타입 검사
```

배포는 `out/`을 정적 호스팅에 올리면 된다. 환경변수는 `.env.example` 참고.

## 구조

```
content/problems/*.yaml     문항 하나당 파일 하나 (파일명 = id)
templates/problem.yaml      초안 템플릿
src/figures/*.svg           문제 그림 (다시 그린 SVG)
src/lib/exams.ts            회차 등록부: 공식 문제지 링크, 이용 조건 확인 기록
src/lib/schema.ts           문항 스키마 + 공개 조건(publishBlockers)
src/lib/query.ts            검색어 해석 ('2027 수능 22번' = '27수능 22' = '2027학년도 수능 수학 22번')
src/lib/track.ts            핵심 지표 이벤트 (두 번째 문항 열람). 분석 도구 미연결
src/app/[kind]/[year]/[subject]/[[...number]]/   회차 목록·문항 페이지 (Next.js 정적 export)
```

## 문서

| 문서 | 무엇을 위한 것 |
| - | - |
| `CLAUDE.md` (= `AGENTS.md`) | AI 에이전트 작업 지침: 문서 지도, 완료 기준, 함정 |
| `docs/prd.md` | 제품 요구사항(SRS 겸): 목적, 범위, FR/NFR과 통과 기준·상태, 지표 |
| `docs/architecture.md` | 설계: 빌드 모드, 디렉터리, 데이터 모델, 공개 조건, 외부 연결 |
| `docs/adr/` | 되돌리기 어려운 결정과 그 이유 |
| `GLOSSARY.md` | 용어집 |
| `docs/roadmap.md` | 단계, 현재 위치, 할 일, 위험 |
| `docs/content-guide.md` | 해설·문제 본문 작성과 발행 흐름 |
| `docs/pilot.md` | 8문항 파일럿 계획과 통과 기준 |
| `docs/review-sheet.md` | 사람 검수표 |

## 기획안의 원칙이 코드에 반영된 위치

| 원칙 | 구현 |
| - | - |
| 검수를 통과한 문항만 공개 | `status: published`는 정답 대조·풀이 검수·모바일 미리보기 기록(고난도는 독립 재풀이까지)이 있어야 빌드 통과 |
| 첫 식의 근거·오답 주의점을 같은 위치에 | `firstIdea`, `pitfalls` 필수 필드. 풀이 맨 위 / 정답 아래 고정 |
| 문제는 바로 보이게 | 문제를 텍스트·수식(`problem`)과 SVG 그림(`src/figures/`)으로 다시 입력해 제목 바로 아래 표시. 선택형은 정답 값과 선택지가 어긋나면 공개 불가 |
| 빈 페이지를 검색에 노출하지 않음 | 초안은 배포 빌드에서 페이지 없음. 공개 문항 없는 회차·검색·수정 중 페이지는 noindex. 사이트맵은 공개 문항만 |
| 광고는 검수된 풀이 아래 한 곳 | `AdSlot`은 published 문항 페이지에서만, 환경변수가 있을 때만 렌더링 |
| 오류 시 즉시 내림 | `status: withdrawn` → 같은 주소에 "수정 중" 안내, 목록·검색·사이트맵 제외 |
| 학생 식별정보 미수집 | 로그인 없음. 오류 신고는 유형+설명만. 측정은 세션 내 열람 문항 id만 sessionStorage에 |
| 2028 수험생 기준 묶음 | 개념 태그에 2015·2022 개정 과목명 병기 |
