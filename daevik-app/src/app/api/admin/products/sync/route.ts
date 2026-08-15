import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export async function POST() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const productsDir = path.join(process.cwd(), 'local_products');
    
    if (!fs.existsSync(productsDir)) {
      fs.mkdirSync(productsDir, { recursive: true });
      return NextResponse.json({ message: 'No products to sync. Created local_products directory.' }, { status: 200 });
    }

    const folders = fs.readdirSync(productsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    if (folders.length === 0) {
      return NextResponse.json({ message: 'No products found in local_products directory' }, { status: 200 });
    }

    const syncedProducts = [];
    const errors = [];

    for (const slug of folders) {
      const productPath = path.join(productsDir, slug);
      const configPath = path.join(productPath, 'config.json');
      
      let config = {
        name: slug,
        price: 0,
        gateway_provider: 'razorpay',
        status: 'draft',
      } as any;

      if (fs.existsSync(configPath)) {
        try {
          config = { ...config, ...JSON.parse(fs.readFileSync(configPath, 'utf-8')) };
        } catch (e) {
          errors.push(`Failed to parse config.json for ${slug}`);
          continue;
        }
      }

      const readHtml = (filename: string) => {
        const filePath = path.join(productPath, filename);
        return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null;
      };

      const landing_page_html = readHtml('sales.html');
      const checkout_page_html = readHtml('checkout.html');
      const thank_you_page_html = readHtml('thankyou.html');

      const productData = {
        name: config.name || slug,
        slug: slug,
        price: Number(config.price) || 0,
        description: config.description || null,
        tag: config.tag || null,
        thumbnail_url: config.thumbnail_url || null,
        product_file_url: config.product_file_url || null,
        gateway_provider: config.gateway_provider || 'razorpay',
        status: config.status || 'draft',
        seo_title: config.seo_title || null,
        seo_description: config.seo_description || null,
        og_image_url: config.og_image_url || null,
        fb_pixel_id: config.fb_pixel_id || null,
        landing_page_html,
        checkout_page_html,
        thank_you_page_html,
      };

      // Upsert based on slug
      // Since supabase doesn't have a direct upsert on non-primary key via JS easily, we query first
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .single();

      let res;
      if (existing) {
        // Update
        res = await supabase
          .from('products')
          .update(productData)
          .eq('id', existing.id);
      } else {
        // Insert
        res = await supabase
          .from('products')
          .insert(productData);
      }

      if (res.error) {
        errors.push(`Failed to sync ${slug}: ${res.error.message}`);
      } else {
        syncedProducts.push(slug);
      }
    }

    if (errors.length > 0 && syncedProducts.length === 0) {
      return NextResponse.json({ error: 'Failed to sync any products', details: errors }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      synced: syncedProducts, 
      errors: errors.length > 0 ? errors : undefined 
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
