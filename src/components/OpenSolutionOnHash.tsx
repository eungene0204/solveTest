'use client';

import { useEffect } from 'react';

/** 단계 링크(#step-n)로 들어오면 접힌 풀이를 연다. */
export default function OpenSolutionOnHash() {
  useEffect(() => {
    const openFor = () => {
      if (location.hash.startsWith('#step-')) document.querySelector<HTMLDetailsElement>('#solution')?.setAttribute('open', '');
    };
    openFor();
    addEventListener('hashchange', openFor);
    return () => removeEventListener('hashchange', openFor);
  }, []);
  return null;
}
