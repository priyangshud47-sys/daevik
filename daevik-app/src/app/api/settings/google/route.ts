import { NextResponse } from 'next/server';
import { getGoogleTrackingConfig } from '@/lib/google-config';

// Revalidate every 60 seconds
export const revalidate = 60;

export async function GET() {
  try {
    const config = await getGoogleTrackingConfig();
    
    // Return only active and public properties (no secret admin values)
    if (!config.active) {
      return NextResponse.json({ active: false });
    }

    return NextResponse.json({
      active: config.active,
      google_ads_id: config.google_ads_id || null,
      purchase_conversion_label: config.purchase_conversion_label || null,
      begin_checkout_conversion_label: config.begin_checkout_conversion_label || null,
      view_item_conversion_label: config.view_item_conversion_label || null,
      ga4_id: config.ga4_id || null,
      enhanced_conversions: config.enhanced_conversions ?? true,
    });
  } catch (err) {
    console.error('Failed to get public Google tracking config:', err);
    return NextResponse.json({ active: false });
  }
}
