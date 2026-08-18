import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;
  const { provider } = resolvedParams;

  const { data, error } = await supabase
    .from('payment_gateways')
    .select('*')
    .eq('provider', provider)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Gateway not found' }, { status: 404 });
  }

  // Very basic mock test for connection since we're just simulating success if the key exists
  // In a real app, you would make an API call to the provider's /ping or /test endpoint
  if (data.api_key && data.api_secret) {
    return NextResponse.json({ success: true, message: `Connected to ${provider}` });
  }

  return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
}
