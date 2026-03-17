import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { discogsFetch } from '@/lib/discogs/client';
import type { DiscogsRelease } from '@/lib/schemas';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: { message: 'Authentication required', code: 'UNAUTHORIZED' } },
      { status: 401 }
    );
  }

  const releaseId = parseInt(params.id, 10);
  if (isNaN(releaseId) || releaseId <= 0) {
    return NextResponse.json(
      { error: { message: 'Invalid release ID', code: 'VALIDATION_ERROR' } },
      { status: 400 }
    );
  }

  const result = await discogsFetch<DiscogsRelease>({
    path: `/releases/${releaseId}`,
  });

  if (result.error) {
    const codeMap: Record<number, string> = {
      404: 'NOT_FOUND',
      429: 'RATE_LIMITED',
    };
    return NextResponse.json(
      { error: { message: result.error.message, code: codeMap[result.error.status] || 'DISCOGS_ERROR' } },
      { status: result.error.status }
    );
  }

  return NextResponse.json({ data: result.data });
}
