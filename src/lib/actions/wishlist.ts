'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  AddToWishlistInput,
  MoveToCollectionInput,
  type WishlistItem,
  type CollectionItem,
} from '@/lib/schemas';
import { toCamelCase, toSnakeCase } from '@/lib/utils/case-mapper';

export async function addToWishlist(input: unknown) {
  const parsed = AddToWishlistInput.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' } };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: { message: 'Authentication required', code: 'UNAUTHORIZED' } };
  }

  const row = toSnakeCase({ ...parsed.data, userId: user.id });

  const { data, error } = await supabase
    .from('wishlist_items')
    .insert(row)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: { message: 'This release is already in your wishlist', code: 'DUPLICATE' } };
    }
    return { error: { message: error.message, code: 'DATABASE_ERROR' } };
  }

  const item = toCamelCase<WishlistItem>(data);
  revalidatePath('/wishlist');
  return { data: item };
}

export async function removeFromWishlist(input: { id: string }) {
  if (!input.id) {
    return { error: { message: 'ID is required', code: 'VALIDATION_ERROR' } };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: { message: 'Authentication required', code: 'UNAUTHORIZED' } };
  }

  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('id', input.id);

  if (error) {
    return { error: { message: error.message, code: 'DATABASE_ERROR' } };
  }

  revalidatePath('/wishlist');
  return { data: { id: input.id } };
}

export async function moveWishlistToCollection(input: unknown) {
  const parsed = MoveToCollectionInput.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' } };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: { message: 'Authentication required', code: 'UNAUTHORIZED' } };
  }

  const { data: wishlistRow, error: fetchError } = await supabase
    .from('wishlist_items')
    .select()
    .eq('id', parsed.data.wishlistItemId)
    .single();

  if (fetchError || !wishlistRow) {
    return { error: { message: 'Wishlist item not found', code: 'NOT_FOUND' } };
  }

  const wishlistItem = toCamelCase<WishlistItem>(wishlistRow);

  const collectionRow = toSnakeCase({
    userId: user.id,
    discogsReleaseId: wishlistItem.discogsReleaseId,
    title: wishlistItem.title,
    artist: wishlistItem.artist,
    coverImageUrl: wishlistItem.coverImageUrl,
    year: wishlistItem.year,
    genres: wishlistItem.genres,
    styles: wishlistItem.styles,
    format: wishlistItem.format,
    label: wishlistItem.label,
    conditionMedia: parsed.data.conditionMedia ?? null,
    conditionSleeve: parsed.data.conditionSleeve ?? null,
    notes: wishlistItem.notes,
    purchasePrice: parsed.data.purchasePrice ?? null,
    purchaseDate: parsed.data.purchaseDate ?? null,
  });

  const { data: collectionData, error: insertError } = await supabase
    .from('collection_items')
    .insert(collectionRow)
    .select()
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      return { error: { message: 'This release is already in your collection', code: 'DUPLICATE' } };
    }
    return { error: { message: insertError.message, code: 'DATABASE_ERROR' } };
  }

  const { error: deleteError } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('id', parsed.data.wishlistItemId);

  if (deleteError) {
    await supabase.from('collection_items').delete().eq('id', collectionData.id);
    return { error: { message: 'Failed to remove from wishlist', code: 'DATABASE_ERROR' } };
  }

  const item = toCamelCase<CollectionItem>(collectionData);
  revalidatePath('/wishlist');
  revalidatePath('/collection');
  revalidatePath('/stats');
  return { data: item };
}
