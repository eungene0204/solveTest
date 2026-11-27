import { z } from 'astro/zod';
import { EXAM_KINDS, PARTS, SUBJECTS, findExam } from './exams';

/**
 * 발행 흐름: 초안 → 정답 대조 → 풀이 검수 → 모바일 미리보기 → 공개.
 * 각 단계를 마치면 reviews에 기록하고, 모든 단계가 기록돼야 status: published 빌드가 통과한다.
 */
export const REVIEW_STEPS = ['answer-check', 'solution-review', 'mobile-preview', 'independent-resolve'] as const;
export type ReviewStep = (typeof REVIEW_STEPS)[number];

export const REVIEW_LABEL: Record<ReviewStep, string> = {
  'answer-check': '공식 정답 대조',
  'solution-review': '풀이 검수',
  'mobile-preview': '모바일 미리보기',
  'independent-resolve': '독립 재풀이',
};

const md = z.string().trim().min(1);

/** 2015 개정(수학Ⅰ·Ⅱ)과 2022 개정(대수·미적분Ⅰ·확률과 통계) 과목명을 함께 기록해 2028 수험생 기준으로도 묶을 수 있게 한다. */
const concept = z.object({
  label: z.string().min(1),
  course2015: z.enum(['수학Ⅰ', '수학Ⅱ', '확률과 통계', '미적분', '기하']),
  course2022: z.enum(['대수', '미적분Ⅰ', '확률과 통계', '미적분Ⅱ', '기하']).optional(),
});

const date = z.coerce.date();

export const problemFields = z.object({
  exam: z.object({
    year: z.number().int().min(2000).max(2100),
    kind: z.enum(EXAM_KINDS),
    subject: z.enum(SUBJECTS),
    part: z.enum(PARTS),
  }),
  number: z.number().int().min(1).max(30),
  /** 정답 선택지 번호의 기준 시험지 유형 */
  paperType: z.enum(['odd', 'even']).default('odd'),
  /** 공식 PDF에서 이 문항이 있는 쪽 */
  paperPage: z.number().int().min(1).optional(),
  /** 입력 대조용 원문 이미지를 잘라낼 영역 (쪽 대비 비율 x0, y0, x1, y1). `npm run crop` 이 .cache/crops/ 에 저장한다. 화면에는 쓰지 않는다. */
  paperCrop: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  /**
   * 문제 본문. 원문 이미지 대신 텍스트·수식으로 다시 입력해 보여준다.
   * 화면 순서: body → figure → conditions(상자) → after → choices
   */
  problem: z
    .object({
      body: md,
      /** src/figures/<이름>.svg 의 이름. 그래프·도형을 SVG로 다시 그린 것 */
      figure: z.string().optional(),
      /** 조건 상자의 항목. "(가) ..." 형태로 쓴다. */
      conditions: z.array(md).optional(),
      /** 그림·조건 상자 뒤에 오는 문장 (보통 묻는 말) */
      after: md.optional(),
      /** 5지선다 선택지 ①~⑤ */
      choices: z.array(z.string().trim().min(1)).length(5).optional(),
    })
    .optional(),
  format: z.enum(['choice', 'short']),
  answer: z.object({
    /** 정답 값 (선택형이면 선택지에 적힌 값) */
    value: z.string().trim().min(1),
    /** 선택형일 때 paperType 기준 선택지 번호 */
    choice: z.number().int().min(1).max(5).optional(),
    /** 홀수형과 짝수형의 선택지 번호가 다를 때 반대 유형의 번호 */
    choiceOtherPaper: z.number().int().min(1).max(5).optional(),
  }),
  status: z.enum(['draft', 'published', 'withdrawn']),
  difficulty: z.enum(['basic', 'standard', 'hard']),
  concepts: z.array(concept).min(1),
  hint: md,
  /** 첫 식을 세우는 근거. 모든 해설에서 같은 위치에 보인다. */
  firstIdea: md,
  steps: z.array(z.object({ title: z.string().trim().min(1), body: md, why: md })).min(1),
  /** 자주 틀리는 지점. 모든 해설에서 같은 위치에 보인다. */
  pitfalls: z.array(md).min(1),
  /** 개념이 실제로 이어지는 문항 id. 공개된 문항만 화면에 표시된다. */
  related: z.array(z.string()).default([]),
  reviews: z
    .array(z.object({ step: z.enum(REVIEW_STEPS), by: z.string().min(1), date, note: z.string().optional() }))
    .default([]),
  changelog: z.array(z.object({ date, note: z.string().min(1) })).default([]),
  /** 파일럿 측정용: 문항당 작성·검수 시간(분) */
  minutes: z.object({ writing: z.number().optional(), review: z.number().optional() }).optional(),
});

export type ProblemData = z.infer<typeof problemFields>;

const TODO = /TODO/;
/** 선택지와 정답 값 비교용: $, 공백, \dfrac/\frac 차이를 무시한다. */
const bare = (s: string) => s.replace(/\$/g, '').replace(/\\dfrac/g, '\\frac').replace(/\s+/g, '');

/** 공개를 막는 사유 목록. 비어 있으면 공개 가능하다. 미리보기 배너에서도 사용한다. */
export function publishBlockers(p: ProblemData): string[] {
  const out: string[] = [];
  const done = new Set(p.reviews.map((r) => r.step));
  const required: ReviewStep[] = ['answer-check', 'solution-review', 'mobile-preview'];
  if (p.difficulty === 'hard') required.push('independent-resolve');
  for (const step of required) if (!done.has(step)) out.push(`${REVIEW_LABEL[step]} 기록 없음`);

  const exam = findExam(p.exam);
  if (!exam) out.push('exams.ts에 등록되지 않은 회차');
  else {
    if (!exam.paperUrl) out.push('회차의 공식 문제지 링크(paperUrl) 없음');
    if (p.number > exam.count) out.push(`문항 번호가 회차 문항 수(${exam.count})를 넘음`);
  }

  if (p.format === 'choice' && p.answer.choice == null) out.push('선택형인데 정답 선택지 번호(answer.choice) 없음');
  if (p.format === 'short' && p.answer.choice != null) out.push('단답형인데 선택지 번호가 있음');

  if (!p.problem) out.push('문제 본문(problem) 없음');
  else {
    if (p.format === 'choice' && !p.problem.choices) out.push('선택형인데 선택지(problem.choices) 없음');
    if (p.format === 'short' && p.problem.choices) out.push('단답형인데 선택지가 있음');
    const picked = p.answer.choice != null ? p.problem.choices?.[p.answer.choice - 1] : undefined;
    if (picked != null && bare(picked) !== bare(p.answer.value))
      out.push(`정답 값(${p.answer.value})과 ${p.answer.choice}번 선택지(${picked})가 다름`);
  }

  const pr = p.problem;
  const problemText = pr ? [pr.body, pr.after ?? '', ...(pr.conditions ?? []), ...(pr.choices ?? [])] : [];
  const text = [...problemText, p.hint, p.firstIdea, ...p.steps.flatMap((s) => [s.title, s.body, s.why]), ...p.pitfalls, p.answer.value];
  if (text.some((t) => TODO.test(t))) out.push('본문에 TODO가 남아 있음');
  if (p.changelog.length === 0) out.push('수정 기록(changelog) 없음');
  return out;
}

export const problemSchema = problemFields.superRefine((p, ctx) => {
  if (p.status !== 'published') return;
  for (const message of publishBlockers(p)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `공개 불가: ${message}` });
});
