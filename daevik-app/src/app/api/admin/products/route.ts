// Admin Products API — List all products and Create new product
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET — List all products (admin)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  let query = supabase.from('products').select('*');

  if (type === 'file') {
    query = query.eq('tag', 'digital_file');
  } else {
    // Projects shouldn't include pure digital files, but must include those with no tag
    query = query.or('tag.neq.digital_file,tag.is.null');
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST — Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('products')
      .insert({
        name: body.name,
        slug: body.slug,
        price: body.price,
        description: body.description || null,
        tag: body.tag || null,
        thumbnail_url: body.thumbnail_url || null,
        landing_page_html: body.landing_page_html || null,
        landing_page_url: body.landing_page_url || null,
        product_file_url: body.product_file_url || null,
        gateway_provider: body.gateway_provider || 'razorpay',
        seo_title: body.seo_title || null,
        seo_description: body.seo_description || null,
        og_image_url: body.og_image_url || null,
        status: body.status || 'draft',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
