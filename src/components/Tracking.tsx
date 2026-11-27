'use client';

import { useEffect } from 'react';
import { initTracking } from '../lib/track';

/** 페이지가 열릴 때 측정을 시작한다. 사이트 안 링크는 일반 <a>라 페이지마다 다시 실행된다. */
export default function Tracking() {
  useEffect(() => initTracking(), []);
  return null;
}
