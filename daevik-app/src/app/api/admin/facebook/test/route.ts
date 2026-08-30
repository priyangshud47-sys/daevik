import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Note: Auth is enforced by middleware (proxy.ts authorized callback) — no duplicate check needed
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  // Update updated_at to track when a test event was last sent
  const { error } = await supabase
    .from('fb_capi_config')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
