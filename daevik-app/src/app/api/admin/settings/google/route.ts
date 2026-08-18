import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase.from('site_settings').select('*').eq('key', 'google_analytics').single();
  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ? data.value : { ga4_id: '' });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  
  const { data, error } = await supabase
    .from('site_settings')
    .upsert(
      { key: 'google_analytics', value: body, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data.value);
}
