'use server';

import { createClient } from '@/lib/supabase/server';
import { toCamelCase } from '@/lib/utils/case-mapper';
import type { CollectionItem } from '@/lib/schemas';

export async function getCollectionStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: { message: 'Authentication required', code: 'UNAUTHORIZED' } };
  }

  const { data: rows, error } = await supabase
    .from('collection_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return { error: { message: error.message, code: 'DATABASE_ERROR' } };
  }

  const items = (rows || []).map((row: Record<string, unknown>) => toCamelCase<CollectionItem>(row));
  const totalRecords = items.length;

  const genreCounts = new Map<string, number>();
  for (const item of items) {
    for (const genre of item.genres || []) {
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
    }
  }
  const genreDistribution = Array.from(genreCounts.entries())
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count);

  const decadeCounts = new Map<string, number>();
  for (const item of items) {
    if (item.year) {
      const decade = `${Math.floor(item.year / 10) * 10}s`;
      decadeCounts.set(decade, (decadeCounts.get(decade) || 0) + 1);
    }
  }
  const decadeDistribution = Array.from(decadeCounts.entries())
    .map(([decade, count]) => ({ decade, count }))
    .sort((a, b) => a.decade.localeCompare(b.decade));

  const formatCounts = new Map<string, number>();
  for (const item of items) {
    const fmt = item.format || 'Unknown';
    formatCounts.set(fmt, (formatCounts.get(fmt) || 0) + 1);
  }
  const formatDistribution = Array.from(formatCounts.entries())
    .map(([format, count]) => ({ format, count }))
    .sort((a, b) => b.count - a.count);

  const conditionCounts = new Map<string, number>();
  for (const item of items) {
    const cond = item.conditionMedia || 'Ungraded';
    conditionCounts.set(cond, (conditionCounts.get(cond) || 0) + 1);
  }
  const conditionDistribution = Array.from(conditionCounts.entries())
    .map(([condition, count]) => ({ condition, count }))
    .sort((a, b) => b.count - a.count);

  const recentAdditions = items.slice(0, 5);

  return {
    data: {
      totalRecords,
      genreDistribution,
      decadeDistribution,
      formatDistribution,
      conditionDistribution,
      recentAdditions,
    },
  };
}
