// Serves uploaded landing page HTML for iframe rendering
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data: product, error } = await supabase
    .from('products')
    .select('landing_page_html, name')
    .eq('slug', slug)
    .eq('status', 'live')
    .single();

  if (error || !product || !product.landing_page_html) {
    return new NextResponse('<h1>Landing page not found</h1>', {
      status: 404,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return new NextResponse(product.landing_page_html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'SAMEORIGIN',
    },
  });
}
