import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
// Astro 7: importing `z` from 'astro:content' is deprecated — import zod directly.
import { z } from 'zod';

/**
 * Content schemas — see website-requirements.md §5.
 * Content lives at src/content/<collection>/<lang>/<slug>.mdx
 */

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().max(160),
    category: z.enum(['course', 'personal', 'tool']),
    tech: z.array(z.string()).default([]),
    role: z.string(),
    status: z.enum(['complete', 'prototype', 'ongoing']).default('complete'),
    repo: z.url().optional(),
    demo: z.url().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(999),
    lang: z.enum(['en', 'zh']),
    /** Links the EN and ZH versions of the same project. */
    translationKey: z.string(),
    pubDate: z.coerce.date(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(200),
    tags: z.array(z.string()).default([]),
    category: z.string(),
    lang: z.enum(['en', 'zh']),
    translationKey: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    /** Drafts are excluded from production builds. */
    draft: z.boolean().default(false),
    cover: z.string().optional(),
  }),
});

export const collections = { projects, blog };
