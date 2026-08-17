// Admin Products API — List all products and Create new product
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { supabase } from '@/lib/supabase';
import { hideProductUrls } from '@/lib/utils';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(1).max(255),
  price: z.number().min(0),
  description: z.string().nullable().optional(),
  tag: z.string().nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
  product_file_url: z.string().nullable().optional(),
  gateway_provider: z.enum(['razorpay', 'payu', 'paypal']).default('razorpay'),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional(),
  og_image_url: z.string().url().nullable().optional(),
  status: z.enum(['live', 'draft', 'archived']).default('draft'),
});


// GET — List all products (admin)
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

  return NextResponse.json((data || []).map(p => hideProductUrls(p)));
}

// POST — Create a new product
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Validate payload and strip out any unknown fields (like landing_page_html)
    const validationResult = productSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid payload', details: validationResult.error.errors }, { status: 400 });
    }
    
    const validData = validationResult.data;

    const { data, error } = await supabase
      .from('products')
      .insert({
        ...validData
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(hideProductUrls(data), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
