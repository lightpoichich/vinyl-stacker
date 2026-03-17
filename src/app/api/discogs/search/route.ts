import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { discogsFetch } from '@/lib/discogs/client';
import type { DiscogsSearchResponse } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: { message: 'Authentication required', code: 'UNAUTHORIZED' } },
      { status: 401 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q');
  if (!q || q.trim().length === 0) {
    return NextResponse.json(
      { error: { message: 'Search query (q) is required', code: 'VALIDATION_ERROR' } },
      { status: 400 }
    );
  }

  const type = searchParams.get('type') || 'release';
  const page = searchParams.get('page') || '1';
  const perPage = searchParams.get('per_page') || '15';
  const clampedPerPage = Math.min(Math.max(parseInt(perPage, 10) || 15, 1), 50).toString();

  const result = await discogsFetch<DiscogsSearchResponse>({
    path: '/database/search',
    params: { q, type, page, per_page: clampedPerPage },
  });

  if (result.error) {
    const code = result.error.status === 429 ? 'RATE_LIMITED' : 'DISCOGS_ERROR';
    return NextResponse.json(
      { error: { message: result.error.message, code } },
      { status: result.error.status }
    );
  }

  return NextResponse.json({ data: result.data });
}
