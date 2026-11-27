import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';

// 원시 HTML은 허용하지 않는다(remark-rehype 기본값). 수식은 빌드 시 KaTeX HTML로 렌더링돼 검색엔진도 읽을 수 있다.
const processor = unified()
  .use(remarkParse)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeKatex)
  .use(rehypeStringify);

export function renderMarkdown(src: string): string {
  const html = String(processor.processSync(src));
  if (html.includes('katex-error')) {
    throw new Error(`수식 렌더링 실패:\n${src}`);
  }
  return html;
}

/** 한 문단짜리 텍스트를 <p> 없이 렌더링한다 (제목·목록 항목용). */
export function renderInline(src: string): string {
  const html = renderMarkdown(src).trim();
  const m = html.match(/^<p>([\s\S]*)<\/p>$/);
  return m && !m[1].includes('<p>') ? m[1] : html;
}
