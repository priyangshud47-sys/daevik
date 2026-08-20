import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: config } = await supabase
      .from('fb_capi_config')
      .select('pixel_id')
      .eq('active', true)
      .single();

    return NextResponse.json({
      pixelId: config?.pixel_id || null,
    });
  } catch (error) {
    return NextResponse.json({ pixelId: null }, { status: 500 });
  }
}
