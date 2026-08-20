import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Cache API response for 1 hour to prevent DB DDOS, but can be manually revalidated
export const revalidate = 3600;

export async function GET() {
  try {
    const { data: config } = await supabase
      .from('fb_capi_config')
      .select('pixel_id')
      .eq('active', true)
      .single();

    return NextResponse.json({
      pixelId: config?.pixel_id || process.env.NEXT_PUBLIC_META_PIXEL_ID || null,
    });
  } catch (error) {
    return NextResponse.json({ pixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || null }, { status: 500 });
  }
}
