-- Add new columns to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS checkout_page_html TEXT,
  ADD COLUMN IF NOT EXISTS thank_you_page_html TEXT,
  ADD COLUMN IF NOT EXISTS fb_pixel_id TEXT,
  ADD COLUMN IF NOT EXISTS fb_access_token TEXT;
