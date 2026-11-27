import { notFound } from 'next/navigation';
import AdSlot from '../../../../../components/AdSlot';
import OpenSolutionOnHash from '../../../../../components/OpenSolutionOnHash';
import ReportForm from '../../../../../components/ReportForm';
import { examPath, examTitle, findExam, KIND_LABEL, PART_LABEL } from '../../../../../lib/exams';
import { renderInline, renderMarkdown } from '../../../../../lib/markdown';
import { pageMeta } from '../../../../../lib/meta';
import { allProblems, figureSvg, hasPage, inExam, isListed, PREVIEW, titleOf, urlOf, type Problem } from '../../../../../lib/problems';
import { publishBlockers } from '../../../../../lib/schema';

export type ProblemParams = { kind: string; year: string; subject: string; number: string };

const CIRCLED = ['①', '②', '③', '④', '⑤'];
/** "(가) 내용", "ㄱ. 내용", "• 내용" → 라벨과 내용으로 나눈다. */
const splitCondition = (src: string) => {
  const m = src.match(/^\s*(\([^)]+\)|[ㄱ-ㅎ]\.|•)\s*([\s\S]*)$/);
  return m ? { label: m[1], body: m[2] } : { label: '', body: src };
};

/** 문제 본문의 테두리 상자 (조건, <보기>, 증명 과정 등) */
function ConditionBox({ items, title }: { items: string[]; title?: string }) {
  return (
    <div className={title ? 'problem-conditions titled' : 'problem-conditions'}>
      {title && <div className="box-title">&lt;{title}&gt;</div>}
      {items.map((c, i) => {
        const { label, body } = splitCondition(c);
        return (
          <div className="cond" key={i}>
            {label && <span className="cond-label">{label}</span>}
            <div {...html(renderMarkdown(body))} />
          </div>
        );
      })}
    </div>
  );
}
const fmt = (x: Date) => x.toISOString().slice(0, 10);
/** 빌드 시점에 렌더링한 HTML(마크다운·KaTeX·SVG)을 넣는다. 원시 HTML은 renderMarkdown 단계에서 이미 막혀 있다. */
const html = (__html: string) => ({ dangerouslySetInnerHTML: { __html } });

export function problemStaticParams(): ProblemParams[] {
  return allProblems()
    .filter(hasPage)
    .map((p) => ({
      kind: p.data.exam.kind,
      year: String(p.data.exam.year),
      subject: p.data.exam.subject,
      number: String(p.data.number),
    }));
}

function load(params: ProblemParams): Problem {
  const problem = allProblems().find(
    (p) =>
      hasPage(p) &&
      p.data.exam.kind === params.kind &&
      String(p.data.exam.year) === params.year &&
      p.data.exam.subject === params.subject &&
      String(p.data.number) === params.number,
  );
  if (!problem) notFound();
  return problem;
}

export function problemMetadata(params: ProblemParams) {
  const problem = load(params);
  const title = titleOf(problem);
  return pageMeta({
    title: `${title} 풀이`,
    description: `${title} 힌트와 단계별 풀이. 첫 식을 세우는 근거와 자주 틀리는 지점을 함께 정리했습니다.`,
    path: urlOf(problem),
    noindex: problem.data.status !== 'published',
  });
}

export default function ProblemView({ params }: { params: ProblemParams }) {
  const problem = load(params);
  const d = problem.data;
  const exam = findExam(d.exam)!;
  const title = titleOf(problem);
  const withdrawn = d.status === 'withdrawn';
  const published = d.status === 'published';

  const list = allProblems().filter(isListed);
  const siblings = inExam(list, exam).sort((a, b) => a.data.number - b.data.number);
  const prev = siblings.filter((p) => p.data.number < d.number).at(-1);
  const next = siblings.find((p) => p.data.number > d.number);
  const related = d.related.map((id) => list.find((p) => p.id === id)).filter((p): p is Problem => !!p);

  const blockers = PREVIEW && !published ? publishBlockers(d) : [];
  const paperTypeLabel = d.paperType === 'odd' ? '홀수형' : '짝수형';
  const otherPaperLabel = d.paperType === 'odd' ? '짝수형' : '홀수형';
  const formatLabel = d.format === 'choice' ? '5지선다형' : '단답형';
  const lastReviewed = d.reviews.map((r) => r.date).sort((a, b) => +b - +a)[0];
  const paperHref = exam.paperUrl && d.paperPage ? `${exam.paperUrl}#page=${d.paperPage}` : exam.paperUrl;
  const pr = d.problem;

  const adClient = process.env.PUBLIC_ADSENSE_CLIENT;
  const adSlot = process.env.PUBLIC_ADSENSE_SLOT;
  const showAd = published && !PREVIEW && adClient && adSlot;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: `${title} 풀이`,
    inLanguage: 'ko',
    educationalLevel: '고등학교 3학년',
    learningResourceType: '해설',
    about: d.concepts.map((c) => c.label),
    dateModified: lastReviewed ? fmt(lastReviewed) : undefined,
  };

  return (
    <>
      {published && <script type="application/ld+json" {...html(JSON.stringify(jsonLd).replace(/</g, '\\u003c'))} />}

      {blockers.length > 0 && (
        <details className="banner">
          <summary>초안 · 공개 전 확인할 항목 {blockers.length}건</summary>
          <ul>
            {blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </details>
      )}

      <article data-problem-id={problem.id}>
        <nav className="crumbs" aria-label="위치">
          <a href="/">시험 목록</a> › <a href={examPath(exam)}>{examTitle(exam)}</a>
        </nav>
        <h1>{title}</h1>
        <p className="muted small" style={{ margin: 0 }}>
          {d.exam.year}학년도 · {KIND_LABEL[d.exam.kind]} · 수학 {PART_LABEL[d.exam.part]} · {d.number}번 · {formatLabel}
        </p>

        {pr && (
          <section className="problem" aria-label="문제">
            <div className="problem-text" {...html(`<span class="problem-no">${d.number}.</span>${renderMarkdown(pr.body)}`)} />
            {pr.figure && <div className="problem-figure" {...html(figureSvg(pr.figure))} />}
            {pr.conditions && <ConditionBox items={pr.conditions} title={pr.boxTitle} />}
            {pr.middle && <div className="problem-text" {...html(renderMarkdown(pr.middle))} />}
            {pr.conditions2 && <ConditionBox items={pr.conditions2} />}
            {pr.after && <div className="problem-text" {...html(renderMarkdown(pr.after))} />}
            {pr.choices && (
              <ol className="choices">
                {pr.choices.map((c, i) => (
                  <li key={i}>
                    <span className="choice-no">{CIRCLED[i]}</span> <span {...html(renderInline(c))} />
                  </li>
                ))}
              </ol>
            )}
            <p className="problem-source">
              출처: 한국교육과정평가원 {d.exam.year}학년도 대학수학능력시험 수학 영역 {paperTypeLabel}
            </p>
          </section>
        )}

        <div className="source">
          {paperHref && (
            <a className={pr ? 'btn' : 'btn primary'} href={paperHref} target="_blank" rel="noopener">
              공식 문제지 열기{d.paperPage ? ` (${d.paperPage}쪽)` : ''} ↗
            </a>
          )}
          {exam.answerKeyUrl && (
            <a className="btn" href={exam.answerKeyUrl} target="_blank" rel="noopener">
              공식 정답표 ↗
            </a>
          )}
        </div>
        {!pr && <p className="small muted">문제지는 새 탭에서 열립니다. 이 화면의 읽던 위치는 그대로 유지됩니다.</p>}

        {withdrawn ? (
          <div className="card">
            <p>
              <strong>이 풀이는 수정 중입니다.</strong>
            </p>
            <p className="muted small">오류가 확인돼 공개를 잠시 중지했습니다. 검수한 수정본을 다시 올리겠습니다.</p>
          </div>
        ) : (
          <>
            <ul className="tags" aria-label="개념">
              {d.concepts.map((c) => (
                <li key={c.label}>{c.label}</li>
              ))}
            </ul>

            <details className="fold" data-track="hint_open">
              <summary>힌트 보기</summary>
              <div className="body" {...html(renderMarkdown(d.hint))} />
            </details>

            <details className="fold" id="solution" data-track="solution_open">
              <summary>풀이 보기</summary>
              <div className="body">
                <div className="first-idea" {...html(`<div class="label">왜 이렇게 시작하나</div>${renderMarkdown(d.firstIdea)}`)} />
                {d.steps.length > 1 && (
                  <nav className="step-nav" aria-label="단계로 이동">
                    {d.steps.map((_, i) => (
                      <a key={i} href={`#step-${i + 1}`}>
                        {i + 1}단계
                      </a>
                    ))}
                  </nav>
                )}
                <ol className="steps">
                  {d.steps.map((s, i) => (
                    <li
                      className="step"
                      id={`step-${i + 1}`}
                      key={i}
                      {...html(
                        `<h3>${renderInline(s.title)}</h3>${renderMarkdown(s.body)}` +
                          `<div class="why"><strong>이렇게 하는 이유</strong> ${renderMarkdown(s.why)}</div>`,
                      )}
                    />
                  ))}
                </ol>
              </div>
            </details>

            <details className="fold" data-track="answer_open">
              <summary>정답 보기</summary>
              <div className="body">
                <p className="answer">
                  {d.format === 'choice' && d.answer.choice != null ? (
                    <>
                      {paperTypeLabel} {CIRCLED[d.answer.choice - 1]} <span {...html(renderInline(d.answer.value))} />
                    </>
                  ) : (
                    <span {...html(renderInline(d.answer.value))} />
                  )}
                </p>
                {d.format === 'choice' && d.answer.choiceOtherPaper != null && (
                  <p className="small muted">
                    {otherPaperLabel}은 {CIRCLED[d.answer.choiceOtherPaper - 1]}번입니다. 값으로 확인하세요.
                  </p>
                )}
              </div>
            </details>

            <h2>자주 틀리는 지점</h2>
            <div className="pitfalls">
              <ul>
                {d.pitfalls.map((p, i) => (
                  <li key={i} {...html(renderInline(p))} />
                ))}
              </ul>
            </div>

            {showAd && <AdSlot client={adClient} slot={adSlot} />}

            {related.length > 0 && (
              <>
                <h2>이어서 볼 기출</h2>
                <ul className="stack" style={{ listStyle: 'none', padding: 0 }}>
                  {related.map((r) => (
                    <li className="card" key={r.id}>
                      <a href={urlOf(r)}>{titleOf(r)}</a>
                      <div className="small muted">{r.data.concepts.map((c) => c.label).join(' · ')}</div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}

        <nav className="pager" aria-label="앞뒤 문항">
          {prev ? <a href={urlOf(prev)}>← {prev.data.number}번</a> : <span>처음 문항</span>}
          {next ? (
            <a className="next" href={urlOf(next)}>
              {next.data.number}번 →
            </a>
          ) : (
            <span className="next">마지막 문항</span>
          )}
        </nav>

        <ReportForm problemId={problem.id} endpoint={process.env.PUBLIC_REPORT_ENDPOINT || ''} />

        {(lastReviewed || d.changelog.length > 0) && (
          <details className="fold">
            <summary>검수·수정 기록</summary>
            <div className="body small">
              {lastReviewed && <p>최근 검수: {fmt(lastReviewed)}</p>}
              <ul>
                {d.changelog.map((c, i) => (
                  <li key={i}>
                    {fmt(c.date)} · {c.note}
                  </li>
                ))}
              </ul>
            </div>
          </details>
        )}
      </article>
      <OpenSolutionOnHash />
    </>
  );
}
