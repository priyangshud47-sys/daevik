// Admin Product API — Get, Update, Delete by slug
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

function extractStoragePath(url: string | null) {
  if (!url) return null;
  const bucketName = 'product-files';
  const match = url.match(new RegExp(`${bucketName}/(.+)`));
  if (match && match[1]) {
    return decodeURIComponent(match[1].split('?')[0]);
  }
  return null;
}

// PUT — Update product by slug
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const body = await request.json();

    const { data: existingProduct } = await supabase
      .from('products')
      .select('product_file_url')
      .eq('slug', slug)
      .single();

    // Build update object with only provided fields
    const update: Record<string, unknown> = {};
    const fields = [
      'name', 'slug', 'price', 'description', 'tag', 'thumbnail_url',
      'landing_page_html', 'landing_page_url', 'product_file_url',
      'gateway_provider', 'checkout_config', 'seo_title', 'seo_description', 'og_image_url', 'status'
    ];
    for (const field of fields) {
      if (body[field] !== undefined) {
        update[field] = body[field];
      }
    }

    const { data, error } = await supabase
      .from('products')
      .update(update)
      .eq('slug', slug)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // If file was replaced, delete the old one
    if (
      existingProduct?.product_file_url && 
      update.product_file_url && 
      existingProduct.product_file_url !== update.product_file_url
    ) {
      const oldPath = extractStoragePath(existingProduct.product_file_url);
      if (oldPath) {
        await supabase.storage.from('product-files').remove([oldPath]);
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE — Delete product by slug
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;

  const { data: existingProduct } = await supabase
    .from('products')
    .select('product_file_url')
    .eq('slug', slug)
    .single();

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('slug', slug);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Delete associated file from storage
  if (existingProduct?.product_file_url) {
    const oldPath = extractStoragePath(existingProduct.product_file_url);
    if (oldPath) {
      await supabase.storage.from('product-files').remove([oldPath]);
    }
  }

  return NextResponse.json({ success: true });
}
