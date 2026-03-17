'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  AddToCollectionInput,
  UpdateCollectionItemInput,
  type CollectionItem,
} from '@/lib/schemas';
import { toCamelCase, toSnakeCase } from '@/lib/utils/case-mapper';

export async function addToCollection(input: unknown) {
  const parsed = AddToCollectionInput.safeParse(input);
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
    .from('collection_items')
    .insert(row)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: { message: 'This release is already in your collection', code: 'DUPLICATE' } };
    }
    return { error: { message: error.message, code: 'DATABASE_ERROR' } };
  }

  const item = toCamelCase<CollectionItem>(data);
  revalidatePath('/collection');
  revalidatePath('/stats');
  return { data: item };
}

export async function updateCollectionItem(input: unknown) {
  const parsed = UpdateCollectionItemInput.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' } };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: { message: 'Authentication required', code: 'UNAUTHORIZED' } };
  }

  const { id, ...fields } = parsed.data;
  const updateFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      updateFields[key] = value;
    }
  }

  if (Object.keys(updateFields).length === 0) {
    return { error: { message: 'No fields to update', code: 'VALIDATION_ERROR' } };
  }

  const snakeFields = toSnakeCase(updateFields);

  const { data, error } = await supabase
    .from('collection_items')
    .update(snakeFields)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { error: { message: 'Collection item not found', code: 'NOT_FOUND' } };
    }
    return { error: { message: error.message, code: 'DATABASE_ERROR' } };
  }

  const item = toCamelCase<CollectionItem>(data);
  revalidatePath('/collection');
  revalidatePath(`/collection/${id}`);
  revalidatePath('/stats');
  return { data: item };
}

export async function removeFromCollection(input: { id: string }) {
  if (!input.id) {
    return { error: { message: 'ID is required', code: 'VALIDATION_ERROR' } };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: { message: 'Authentication required', code: 'UNAUTHORIZED' } };
  }

  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('id', input.id);

  if (error) {
    return { error: { message: error.message, code: 'DATABASE_ERROR' } };
  }

  revalidatePath('/collection');
  revalidatePath('/stats');
  return { data: { id: input.id } };
}
