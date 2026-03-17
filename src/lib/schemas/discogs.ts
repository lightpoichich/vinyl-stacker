import { z } from 'zod';

export const DiscogsSearchResultSchema = z.object({
  id: z.number(),
  title: z.string(),
  thumb: z.string(),
  cover_image: z.string(),
  year: z.string().optional(),
  country: z.string().optional(),
  genre: z.array(z.string()).optional(),
  style: z.array(z.string()).optional(),
  format: z.array(z.string()).optional(),
  catno: z.string().optional(),
  label: z.array(z.string()).optional(),
  type: z.string(),
  resource_url: z.string(),
});

export type DiscogsSearchResult = z.infer<typeof DiscogsSearchResultSchema>;

export const DiscogsSearchResponseSchema = z.object({
  results: z.array(DiscogsSearchResultSchema),
  pagination: z.object({
    page: z.number(),
    pages: z.number(),
    items: z.number(),
    per_page: z.number(),
  }),
});

export type DiscogsSearchResponse = z.infer<typeof DiscogsSearchResponseSchema>;

export const DiscogsReleaseSchema = z.object({
  id: z.number(),
  title: z.string(),
  artists: z.array(z.object({
    name: z.string(),
    id: z.number(),
  })),
  year: z.number().optional(),
  genres: z.array(z.string()).optional(),
  styles: z.array(z.string()).optional(),
  country: z.string().optional(),
  labels: z.array(z.object({
    name: z.string(),
    catno: z.string(),
  })).optional(),
  formats: z.array(z.object({
    name: z.string(),
    qty: z.string(),
    descriptions: z.array(z.string()).optional(),
  })).optional(),
  images: z.array(z.object({
    type: z.string(),
    uri: z.string(),
    uri150: z.string(),
    width: z.number(),
    height: z.number(),
  })).optional(),
  tracklist: z.array(z.object({
    position: z.string(),
    title: z.string(),
    duration: z.string(),
  })).optional(),
  notes: z.string().optional(),
});

export type DiscogsRelease = z.infer<typeof DiscogsReleaseSchema>;
