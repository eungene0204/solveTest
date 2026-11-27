'use client';

/**
 * 오류 신고: 유형과 짧은 설명만 받는다. 연락처는 받지 않는다.
 * PUBLIC_REPORT_ENDPOINT 로 JSON을 POST한다. 서버 쪽에서는 IP 기준 요청 제한을 걸어야 한다.
 * endpoint는 빌드 시점에 서버 컴포넌트가 환경변수에서 읽어 넘겨준다.
 */
import { useState, type FormEvent } from 'react';
import { track } from '../lib/track';

interface Props {
  problemId: string;
  endpoint: string;
}

export default function ReportForm({ problemId, endpoint }: Props) {
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    if (data.get('website')) return; // 봇
    setSending(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          problemId,
          type: data.get('type'),
          message: String(data.get('message') ?? '').slice(0, 500),
          page: location.pathname,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      setStatus('신고가 접수됐습니다. 고맙습니다.');
      track('report_sent', { id: problemId });
    } catch {
      setStatus('전송하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSending(false);
    }
  }

  return (
    <details className="fold report" id="report">
      <summary>오류 신고</summary>
      <div className="body">
        {endpoint ? (
          <form onSubmit={onSubmit}>
            <label>
              유형
              <select name="type" required>
                <option value="answer">정답이 틀림</option>
                <option value="logic">풀이 논리가 틀림</option>
                <option value="typo">오타·수식 깨짐</option>
                <option value="source">문항 정보·원문 링크 오류</option>
                <option value="other">기타</option>
              </select>
            </label>
            <label>
              설명 (최대 500자)
              <textarea name="message" rows={3} maxLength={500} required />
            </label>
            <label className="hp" aria-hidden="true">
              비워두세요 <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
            <p className="small muted">연락처는 받지 않습니다. 확인된 오류는 문항 하단 수정 기록에 반영됩니다.</p>
            <button className="primary" type="submit" disabled={sending}>
              보내기
            </button>
            <p className="small" role="status" aria-live="polite">
              {status}
            </p>
          </form>
        ) : (
          <p className="small muted">신고 접수 기능을 준비하고 있습니다.</p>
        )}
      </div>
    </details>
  );
}
