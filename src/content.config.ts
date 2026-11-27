import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { problemSchema } from './lib/schema';

// 문항 하나당 YAML 파일 하나. 파일명이 곧 id다: content/problems/2027-suneung-math-22.yaml
// 밑줄로 시작하는 파일은 무시한다.
const problems = defineCollection({
  loader: glob({ pattern: '**/[^_]*.yaml', base: './content/problems' }),
  schema: problemSchema,
});

export const collections = { problems };
