import { z } from 'zod';
import { ConditionSchema } from './condition';

export const CollectionItemSchema = z.object({
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
  catno: z.string().nullable(),
  country: z.string().nullable(),
  conditionMedia: ConditionSchema.nullable(),
  conditionSleeve: ConditionSchema.nullable(),
  notes: z.string().nullable(),
  purchasePrice: z.number().nullable(),
  purchaseDate: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CollectionItem = z.infer<typeof CollectionItemSchema>;

export const AddToCollectionInput = z.object({
  discogsReleaseId: z.number().int(),
  title: z.string().min(1),
  artist: z.string().min(1),
  coverImageUrl: z.string().url().nullable().optional(),
  year: z.number().int().nullable().optional(),
  genres: z.array(z.string()).optional().default([]),
  styles: z.array(z.string()).optional().default([]),
  format: z.string().nullable().optional(),
  label: z.string().nullable().optional(),
  catno: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  conditionMedia: ConditionSchema.nullable().optional(),
  conditionSleeve: ConditionSchema.nullable().optional(),
  notes: z.string().nullable().optional(),
  purchasePrice: z.number().nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
});

export type AddToCollectionInputType = z.infer<typeof AddToCollectionInput>;

export const UpdateCollectionItemInput = z.object({
  id: z.string().uuid(),
  conditionMedia: ConditionSchema.nullable().optional(),
  conditionSleeve: ConditionSchema.nullable().optional(),
  notes: z.string().nullable().optional(),
  purchasePrice: z.number().nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
});

export type UpdateCollectionItemInputType = z.infer<typeof UpdateCollectionItemInput>;

export const MoveToCollectionInput = z.object({
  wishlistItemId: z.string().uuid(),
  conditionMedia: ConditionSchema.nullable().optional(),
  conditionSleeve: ConditionSchema.nullable().optional(),
  purchasePrice: z.number().nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
});

export type MoveToCollectionInputType = z.infer<typeof MoveToCollectionInput>;
