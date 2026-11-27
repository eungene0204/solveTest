import type { ExamKind } from './exams';

/**
 * 검색어를 학년도·시험·문항 번호로 해석한다.
 * '2027 수능 22번', '2027학년도 수능 수학 22번', '27수능 22', '2027 6모 15' 를 모두 같은 방식으로 읽는다.
 */
export interface ParsedQuery {
  year?: number;
  kind?: ExamKind;
  number?: number;
}

const KIND_WORDS: [RegExp, ExamKind][] = [
  [/6\s*월\s*(모의평가|모평|모의고사)?|6\s*모|6\s*평/, 'june'],
  [/9\s*월\s*(모의평가|모평|모의고사)?|9\s*모|9\s*평/, 'sept'],
  [/대학수학능력시험|수학능력시험|대수능|수능/, 'suneung'],
];
const KIND_LOOKAHEAD = '(?=\\s*(?:대수능|수능|6\\s*[월모평]|9\\s*[월모평]))';

export function parseQuery(raw: string): ParsedQuery {
  let s = ` ${raw.normalize('NFKC').toLowerCase()} `.replace(/학년도|년도|년/g, ' ');
  const out: ParsedQuery = {};

  const full = s.match(/(?<!\d)(20\d{2})(?!\d)/);
  if (full) {
    out.year = Number(full[1]);
    s = s.replace(full[0], ' ');
  } else {
    // 시험명 바로 앞의 두 자리 숫자는 학년도로 본다: '27수능', "'27 6모"
    const short = s.match(new RegExp(`(?<!\\d)'?(\\d{2})${KIND_LOOKAHEAD}`));
    if (short) {
      out.year = 2000 + Number(short[1]);
      s = s.replace(short[0], ' ');
    }
  }

  for (const [re, kind] of KIND_WORDS) {
    const m = s.match(re);
    if (m) {
      out.kind = kind;
      s = s.replace(m[0], ' ');
      break;
    }
  }

  const numbered = s.match(/(?<!\d)(\d{1,2})\s*번/);
  const bare = [...s.matchAll(/(?<!\d)(\d{1,2})(?!\d)/g)].pop();
  const n = Number((numbered ?? bare)?.[1]);
  if (n >= 1 && n <= 30) out.number = n;

  return out;
}

export interface IndexEntry {
  id: string;
  year: number;
  kind: ExamKind;
  number: number;
  url: string;
  title: string;
  concepts: string[];
}

export interface SearchResult {
  parsed: ParsedQuery;
  /** 학년도와 번호가 모두 있어 문항 하나를 가리키는 검색어인지 */
  specific: boolean;
  results: IndexEntry[];
}

export function search(query: string, entries: IndexEntry[]): SearchResult {
  const parsed = parseQuery(query);
  const specific = parsed.year != null && parsed.number != null;
  if (parsed.year != null || parsed.number != null || parsed.kind != null) {
    const results = entries.filter(
      (e) =>
        (parsed.year == null || e.year === parsed.year) &&
        (parsed.kind == null || e.kind === parsed.kind) &&
        (parsed.number == null || e.number === parsed.number),
    );
    return { parsed, specific, results };
  }
  const t = query.trim().toLowerCase();
  if (!t) return { parsed, specific, results: [] };
  const results = entries.filter(
    (e) => e.title.toLowerCase().includes(t) || e.concepts.some((c) => c.toLowerCase().includes(t)),
  );
  return { parsed, specific, results };
}
