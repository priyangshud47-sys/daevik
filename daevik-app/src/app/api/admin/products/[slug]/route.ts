// Admin Product API — Get, Update, Delete by slug
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { supabase } from '@/lib/supabase';
import { hideProductUrls } from '@/lib/utils';
import { z } from 'zod';

const productUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(1).max(255).optional(),
  price: z.number().min(0).optional(),
  description: z.string().nullable().optional(),
  tag: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  product_file_url: z.string().nullable().optional(),
  gateway_provider: z.enum(['razorpay', 'payu', 'paypal', 'cashfree']).optional(),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional(),
  og_image_url: z.string().nullable().optional(),
  status: z.enum(['live', 'draft', 'archived']).optional(),
  checkout_config: z.any().optional(), // allow any json for now
});


export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> | { slug: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rawParams = await context.params;
  const rawSlug = rawParams?.slug || '';
  const slug = decodeURIComponent(rawSlug).trim();

  if (!slug) {
    return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    console.error(`[Admin Product API] Product not found for slug "${slug}":`, error);
    return NextResponse.json({ error: 'Product not found', details: error?.message }, { status: 404 });
  }

  return NextResponse.json(hideProductUrls(data));
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
  context: { params: Promise<{ slug: string }> | { slug: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rawParams = await context.params;
  const slug = decodeURIComponent(rawParams?.slug || '').trim();

  try {
    const body = await request.json();

    // Validate payload and strip out any unknown fields (like landing_page_html)
    const validationResult = productUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid payload', details: validationResult.error.flatten() }, { status: 400 });
    }
    
    const validData = validationResult.data;

    const { data: existingProduct } = await supabase
      .from('products')
      .select('product_file_url')
      .eq('slug', slug)
      .single();

    const { image_url, tags, display_order, ...dbData } = validData as any;
    if (image_url) dbData.thumbnail_url = image_url;

    const { data, error } = await supabase
      .from('products')
      .update(dbData)
      .eq('slug', slug)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // If file was replaced, delete the old one
    const oldPath = extractStoragePath(existingProduct?.product_file_url as string | null);
    const newPath = validData.product_file_url ? extractStoragePath(validData.product_file_url as string | null) : null;
    
    if (oldPath) {
      if (!validData.product_file_url || (newPath && oldPath !== newPath)) {
        // File was removed or changed to a different file
        await supabase.storage.from('product-files').remove([oldPath]);
      }
    }

    return NextResponse.json(hideProductUrls(data));
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
  context: { params: Promise<{ slug: string }> | { slug: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rawParams = await context.params;
  const slug = decodeURIComponent(rawParams?.slug || '').trim();

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
