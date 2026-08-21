import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Cache API response for 1 hour to prevent DB DDOS, but can be manually revalidated
export const revalidate = 3600;

export async function GET() {
  try {
    // Use .order().limit(1) instead of .single() to avoid errors when multiple active configs exist
    const { data: configs } = await supabase
      .from('fb_capi_config')
      .select('pixel_id')
      .eq('active', true)
      .order('updated_at', { ascending: false })
      .limit(1);

    const pixelId = configs?.[0]?.pixel_id || process.env.NEXT_PUBLIC_META_PIXEL_ID || null;

    return NextResponse.json({ pixelId });
  } catch (error) {
    return NextResponse.json({ pixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || null }, { status: 500 });
  }
}
