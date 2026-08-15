// Admin Gateway Configs API
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { supabase } from '@/lib/supabase';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('gateway_configs')
    .select('*')
    .order('provider');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
