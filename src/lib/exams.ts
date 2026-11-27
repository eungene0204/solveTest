/**
 * 시험 회차 등록부.
 * 회차마다 공식 원문 링크와 이용 조건 확인 기록을 함께 둔다(기획안 "원문 이용과 시험별 확장").
 * 이 파일은 astro:content에 의존하지 않으므로 클라이언트 스크립트와 테스트에서도 import할 수 있다.
 */

export const EXAM_KINDS = ['suneung', 'june', 'sept'] as const;
export type ExamKind = (typeof EXAM_KINDS)[number];

export const SUBJECTS = ['math'] as const;
export type Subject = (typeof SUBJECTS)[number];

export const PARTS = ['common'] as const;
export type Part = (typeof PARTS)[number];

export const KIND_LABEL: Record<ExamKind, string> = {
  suneung: '수능',
  june: '6월 모의평가',
  sept: '9월 모의평가',
};

export const SUBJECT_LABEL: Record<Subject, string> = { math: '수학' };
export const PART_LABEL: Record<Part, string> = { common: '공통' };

/** 평가원 수능 공식 공개 페이지 (문제·정답·저작권 안내). 2026-11-27 확인 시 접속 불가 — 현행 주소 확인 필요 */
export const KICE_SUNEUNG_INDEX = 'https://cdn2.kice.re.kr/dev-27dae-suneung/index.html';

export interface RightsRecord {
  /** 현재 사용 형태. 최초 공개안은 공식 원문 링크 + 자체 해설만 사용한다. */
  usage: 'link-only' | 'quoted-with-permission';
  /** 상업적(광고) 이용 조건 확인 결과. 확인 전이면 null. */
  commercialTerms: string | null;
  /** 제3자 지문·이미지 포함 여부. 확인 전이면 null. */
  thirdPartyMaterial: boolean | null;
  /** 마지막 확인 일자 (YYYY-MM-DD). */
  checkedAt: string | null;
}

export interface Exam {
  year: number;
  kind: ExamKind;
  subject: Subject;
  part: Part;
  /** 공통 문항 수 */
  count: number;
  /** 문항이 출제된 교육과정 (2028학년도부터 2022 개정 교육과정) */
  curriculum: '2015' | '2022';
  /** 공식 문제지 PDF. 비어 있으면 해당 회차 문항은 공개할 수 없다. */
  paperUrl?: string;
  /** 공식 정답표 위치 */
  answerKeyUrl?: string;
  rights: RightsRecord;
}

const UNCHECKED: RightsRecord = {
  usage: 'link-only',
  commercialTerms: null,
  thirdPartyMaterial: null,
  checkedAt: null,
};

export const EXAMS: Exam[] = [
  {
    year: 2027,
    kind: 'suneung',
    subject: 'math',
    part: 'common',
    count: 22,
    curriculum: '2015',
    paperUrl: 'https://cdn2.kice.re.kr/27dae-suneung/27DaeSuneung_2.pdf',
    // 가채점 정답(2026-11-19 공개). 이의신청 심사 후 2026-12-01 확정 발표 → 확정본과 다시 대조한다.
    answerKeyUrl: 'https://cdn2.kice.re.kr/27dae-suneung/27DaeSuneung_2a.pdf',
    rights: { ...UNCHECKED },
  },
  {
    year: 2026,
    kind: 'suneung',
    subject: 'math',
    part: 'common',
    count: 22,
    curriculum: '2015',
    // TODO: 평가원 공식 문제지 PDF 주소와 정답표 위치를 확인해 채운다.
    rights: { ...UNCHECKED },
  },
  {
    year: 2025,
    kind: 'suneung',
    subject: 'math',
    part: 'common',
    count: 22,
    curriculum: '2015',
    // TODO: 평가원 공식 문제지 PDF 주소와 정답표 위치를 확인해 채운다.
    rights: { ...UNCHECKED },
  },
];

type ExamKey = { year: number; kind: ExamKind; subject: Subject };

export function findExam(key: ExamKey): Exam | undefined {
  return EXAMS.find((e) => e.year === key.year && e.kind === key.kind && e.subject === key.subject);
}

export const problemId = (e: ExamKey, n: number) => `${e.year}-${e.kind}-${e.subject}-${n}`;
export const examPath = (e: ExamKey) => `/${e.kind}/${e.year}/${e.subject}/`;
export const problemPath = (e: ExamKey, n: number) => `${examPath(e)}${n}/`;
export const examTitle = (e: ExamKey) => `${e.year}학년도 ${KIND_LABEL[e.kind]} ${SUBJECT_LABEL[e.subject]}`;
export const problemTitle = (e: ExamKey, n: number) => `${examTitle(e)} ${n}번`;
