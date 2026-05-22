import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    author: z.string().default(''),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    summary: z.string().default(''),
    draft: z.boolean().default(false),
    source_type: z.string().optional(),
    source_url: z.string().optional(),
  }),
});

export const collections = { articles };
