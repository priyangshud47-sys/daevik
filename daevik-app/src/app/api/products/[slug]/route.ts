// Public Product API — fetch product by slug for checkout (no auth required)
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hideProductUrls } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, price, description, thumbnail_url, gateway_provider')
    .eq('slug', slug)
    .eq('status', 'live')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json(hideProductUrls(data));
}
