import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export interface GoogleTrackingConfig {
  google_ads_id: string;
  purchase_conversion_label: string;
  begin_checkout_conversion_label?: string;
  view_item_conversion_label?: string;
  ga4_id?: string;
  enhanced_conversions: boolean;
  active: boolean;
  updated_at?: string;
}

const DEFAULT_CONFIG: GoogleTrackingConfig = {
  google_ads_id: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || process.env.GOOGLE_ADS_ID || process.env.NEXT_PUBLIC_GOOGLE_TAG_ID || '',
  purchase_conversion_label: process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL || process.env.GOOGLE_ADS_PURCHASE_LABEL || '',
  begin_checkout_conversion_label: process.env.NEXT_PUBLIC_GOOGLE_ADS_CHECKOUT_LABEL || '',
  view_item_conversion_label: process.env.NEXT_PUBLIC_GOOGLE_ADS_VIEW_LABEL || '',
  ga4_id: process.env.NEXT_PUBLIC_GA4_ID || process.env.GA4_ID || '',
  enhanced_conversions: true,
  active: true,
  updated_at: new Date().toISOString(),
};

const LOCAL_STORAGE_FILE = path.join(process.cwd(), '.google-tracking-config.json');

function readLocalConfig(): GoogleTrackingConfig | null {
  try {
    if (fs.existsSync(LOCAL_STORAGE_FILE)) {
      const data = fs.readFileSync(LOCAL_STORAGE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('[GoogleConfig] Failed to read local config file:', err);
  }
  return null;
}

function writeLocalConfig(config: GoogleTrackingConfig): void {
  try {
    fs.writeFileSync(LOCAL_STORAGE_FILE, JSON.stringify(config, null, 2), 'utf8');
  } catch (err) {
    console.warn('[GoogleConfig] Failed to write local config file:', err);
  }
}

/**
 * Retrieves the active Google tracking configuration with layered fallbacks:
 * 1. Supabase site_settings table
 * 2. Local filesystem cache (.google-tracking-config.json)
 * 3. Environment variables (NEXT_PUBLIC_GOOGLE_ADS_ID, etc.)
 */
export async function getGoogleTrackingConfig(): Promise<GoogleTrackingConfig> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('key', 'google_tracking')
      .single();

    if (!error && data && data.value) {
      const merged: GoogleTrackingConfig = {
        ...DEFAULT_CONFIG,
        ...(data.value as Partial<GoogleTrackingConfig>),
        updated_at: data.updated_at || data.value.updated_at,
      };
      // Keep local backup synced
      writeLocalConfig(merged);
      return merged;
    }
  } catch (err) {
    console.warn('[GoogleConfig] Supabase fetch failed, falling back:', err);
  }

  // Fallback to local file or env defaults
  const local = readLocalConfig();
  if (local) {
    return {
      ...DEFAULT_CONFIG,
      ...local,
    };
  }

  return DEFAULT_CONFIG;
}

/**
 * Saves Google tracking configuration to Supabase site_settings and local backup.
 */
export async function saveGoogleTrackingConfig(
  config: Partial<GoogleTrackingConfig>
): Promise<GoogleTrackingConfig> {
  const current = await getGoogleTrackingConfig();
  const updated: GoogleTrackingConfig = {
    ...current,
    ...config,
    // Normalize Google Ads ID format: ensure AW- prefix if purely numeric ID was given
    google_ads_id: formatGoogleAdsId(config.google_ads_id ?? current.google_ads_id),
    purchase_conversion_label: (config.purchase_conversion_label ?? current.purchase_conversion_label).trim(),
    begin_checkout_conversion_label: (config.begin_checkout_conversion_label ?? current.begin_checkout_conversion_label ?? '').trim(),
    view_item_conversion_label: (config.view_item_conversion_label ?? current.view_item_conversion_label ?? '').trim(),
    ga4_id: (config.ga4_id ?? current.ga4_id ?? '').trim(),
    enhanced_conversions: config.enhanced_conversions !== undefined ? config.enhanced_conversions : current.enhanced_conversions,
    active: config.active !== undefined ? config.active : current.active,
    updated_at: new Date().toISOString(),
  };

  // 1. Always write to local backup so it works instantly without DB dependencies
  writeLocalConfig(updated);

  // 2. Persist to Supabase site_settings
  try {
    const { error } = await supabase
      .from('site_settings')
      .upsert(
        {
          key: 'google_tracking',
          value: updated,
          updated_at: updated.updated_at,
        },
        { onConflict: 'key' }
      );

    if (error) {
      console.warn('[GoogleConfig] Supabase upsert error (saved to local backup):', error.message);
    }
  } catch (err) {
    console.warn('[GoogleConfig] Supabase upsert failed (saved to local backup):', err);
  }

  return updated;
}

/**
 * Helper to ensure standard Google Ads ID formatting (e.g. "AW-123456789" or "123456789" -> "AW-123456789")
 */
export function formatGoogleAdsId(id: string | null | undefined): string {
  if (!id) return '';
  const trimmed = id.trim();
  if (!trimmed) return '';
  if (/^\d+$/.test(trimmed)) {
    return `AW-${trimmed}`;
  }
  return trimmed;
}
