/**
 * 핵심 지표(두 번째 문항 열람률) 측정용 최소 이벤트 계층.
 * 분석 도구가 정해지면 send()만 바꾸면 된다. 학생 식별정보는 만들지 않고,
 * 세션 안에서 열어본 문항 id만 sessionStorage에 둔다(탭을 닫으면 사라짐).
 */

type EventName = 'problem_view' | 'second_problem_view' | 'hint_open' | 'solution_open' | 'answer_open' | 'search' | 'report_sent';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function track(name: EventName, params: Record<string, string | number> = {}) {
  send(name, params);
}

function send(name: string, params: Record<string, string | number>) {
  // TODO: 분석 도구 확정 후 연결. 지금은 dataLayer에 쌓기만 한다.
  (window.dataLayer ??= []).push({ event: name, ...params });
}

const KEY = 'viewed-problems';

function viewedSet(): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

export function initTracking() {
  const el = document.querySelector<HTMLElement>('[data-problem-id]');
  if (!el) return;
  const id = el.dataset.problemId!;
  track('problem_view', { id });

  const viewed = viewedSet();
  if (!viewed.has(id)) {
    viewed.add(id);
    try {
      sessionStorage.setItem(KEY, JSON.stringify([...viewed]));
    } catch {
      /* 저장소를 쓸 수 없는 환경이면 측정만 건너뛴다 */
    }
    if (viewed.size === 2) track('second_problem_view', { id });
  }

  for (const d of document.querySelectorAll<HTMLDetailsElement>('details[data-track]')) {
    d.addEventListener('toggle', () => d.open && track(d.dataset.track as EventName, { id }), { once: false });
  }
}
