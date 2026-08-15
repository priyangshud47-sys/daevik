// Admin Gateway Config Update API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { supabase } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { provider } = await params;
  const body = await request.json();

  const update: Record<string, unknown> = {};
  if (body.api_key !== undefined) update.api_key = body.api_key;
  if (body.api_secret !== undefined) update.api_secret = body.api_secret;
  if (body.webhook_secret !== undefined) update.webhook_secret = body.webhook_secret;
  if (body.active !== undefined) update.active = body.active;
  if (body.mode !== undefined) {
    update.extra_config = { mode: body.mode };
  }

  const { data, error } = await supabase
    .from('gateway_configs')
    .update(update)
    .eq('provider', provider)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
