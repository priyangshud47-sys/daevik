-- ==============================================
-- Site Settings Table for Google Ads & Analytics
-- Run this in your Supabase SQL Editor
-- ==============================================

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read of non-sensitive settings (like google_tracking)
CREATE POLICY "Public can read site settings"
  ON site_settings FOR SELECT
  USING (true);

-- Insert default google_tracking row if not present
INSERT INTO site_settings (key, value)
VALUES (
  'google_tracking',
  '{
    "google_ads_id": "",
    "purchase_conversion_label": "",
    "begin_checkout_conversion_label": "",
    "view_item_conversion_label": "",
    "ga4_id": "",
    "enhanced_conversions": true,
    "active": true
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
