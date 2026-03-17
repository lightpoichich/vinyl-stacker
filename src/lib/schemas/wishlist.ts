import { z } from 'zod';

export const WishlistItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  discogsReleaseId: z.number().int(),
  title: z.string(),
  artist: z.string(),
  coverImageUrl: z.string().url().nullable(),
  year: z.number().int().nullable(),
  genres: z.array(z.string()),
  styles: z.array(z.string()),
  format: z.string().nullable(),
  label: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export type WishlistItem = z.infer<typeof WishlistItemSchema>;

export const AddToWishlistInput = z.object({
  discogsReleaseId: z.number().int(),
  title: z.string().min(1),
  artist: z.string().min(1),
  coverImageUrl: z.string().url().nullable().optional(),
  year: z.number().int().nullable().optional(),
  genres: z.array(z.string()).optional().default([]),
  styles: z.array(z.string()).optional().default([]),
  format: z.string().nullable().optional(),
  label: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type AddToWishlistInputType = z.infer<typeof AddToWishlistInput>;
