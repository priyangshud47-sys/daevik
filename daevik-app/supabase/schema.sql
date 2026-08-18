-- ==============================================
-- Daevik.in — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ==============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- ADMIN USERS
-- ==============================================
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- PRODUCTS
-- ==============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  tag TEXT,
  thumbnail_url TEXT,
  landing_page_html TEXT,
  landing_page_url TEXT,
  checkout_page_html TEXT,
  thank_you_page_html TEXT,
  checkout_config JSONB DEFAULT '{}',
  product_file_url TEXT,
  gateway_provider TEXT NOT NULL DEFAULT 'razorpay' CHECK (gateway_provider IN ('razorpay', 'payu', 'paypal')),
  fb_pixel_id TEXT,
  fb_access_token TEXT,
  seo_title TEXT,
  seo_description TEXT,
  og_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('live', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_status ON products(status);

-- ==============================================
-- CUSTOMERS
-- ==============================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);

-- ==============================================
-- ORDERS
-- ==============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  gateway_used TEXT NOT NULL CHECK (gateway_used IN ('razorpay', 'payu', 'paypal')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  download_count INTEGER DEFAULT 0,
  transaction_id TEXT,
  gateway_order_id TEXT,
  gateway_response JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_product ON orders(product_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(payment_status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_transaction ON orders(transaction_id);

-- ==============================================
-- FUNNEL EVENTS
-- ==============================================
CREATE TABLE funnel_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'checkout_start', 'purchase', 'abandoned')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_funnel_product ON funnel_events(product_id);
CREATE INDEX idx_funnel_event_type ON funnel_events(event_type);
CREATE INDEX idx_funnel_session ON funnel_events(session_id);
CREATE INDEX idx_funnel_created ON funnel_events(created_at DESC);

-- ==============================================
-- EMAIL TEMPLATES
-- ==============================================
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'Product Delivery',
  subject TEXT NOT NULL DEFAULT 'Your purchase from Daevik — {{product_name}}',
  body TEXT NOT NULL DEFAULT '<h1>Thank you, {{customer_name}}!</h1><p>Your purchase of <strong>{{product_name}}</strong> is ready.</p><p>Download your product using the link below:</p><p><a href="{{download_link}}">Download Now</a></p><p>If you have any questions, reply to this email.</p><p>— Team Daevik</p>',
  sender_name TEXT NOT NULL DEFAULT 'Daevik',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default template
INSERT INTO email_templates (name, subject, body, sender_name, is_default) VALUES (
  'Product Delivery',
  'Your purchase from Daevik — {{product_name}}',
  '<h1>Thank you, {{customer_name}}!</h1><p>Your purchase of <strong>{{product_name}}</strong> is ready.</p><p>Download your product using the link below:</p><p><a href="{{download_link}}">Download Now</a></p><p>If you have any questions, reply to this email.</p><p>— Team Daevik</p>',
  'Daevik',
  true
);

-- ==============================================
-- EMAIL LOGS
-- ==============================================
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_logs_order ON email_logs(order_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);

-- ==============================================
-- GATEWAY CONFIGS
-- ==============================================
CREATE TABLE gateway_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT UNIQUE NOT NULL CHECK (provider IN ('razorpay', 'payu', 'paypal')),
  api_key TEXT,
  api_secret TEXT,
  webhook_secret TEXT,
  extra_config JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default gateway entries
INSERT INTO gateway_configs (provider, active) VALUES
  ('razorpay', false),
  ('payu', false),
  ('paypal', false);

-- ==============================================
-- FACEBOOK CAPI CONFIG
-- ==============================================
CREATE TABLE fb_capi_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pixel_id TEXT,
  access_token TEXT,
  test_event_code TEXT,
  active BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default row
INSERT INTO fb_capi_config (active) VALUES (false);

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- All tables are locked down; backend uses service-role key
-- ==============================================
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gateway_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_capi_config ENABLE ROW LEVEL SECURITY;

-- Allow public read of live products (for the home page / landing pages)
CREATE POLICY "Public can read live products"
  ON products FOR SELECT
  USING (status = 'live');

-- Allow public insert on funnel_events (for tracking)
CREATE POLICY "Public can insert funnel events"
  ON funnel_events FOR INSERT
  WITH CHECK (true);

-- Allow public insert on customers (checkout creates customer)
CREATE POLICY "Public can insert customers"
  ON customers FOR INSERT
  WITH CHECK (true);

-- Service role has full access (handled by Supabase automatically)
-- No additional policies needed for admin operations via service-role key

-- ==============================================
-- HELPER FUNCTIONS
-- ==============================================

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gateway_configs_updated_at
  BEFORE UPDATE ON gateway_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fb_capi_config_updated_at
  BEFORE UPDATE ON fb_capi_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- --------------------------------------------------------
-- Table: smtp_configs
-- Purpose: Store custom SMTP configuration for sending emails
-- --------------------------------------------------------
CREATE TABLE smtp_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    secure BOOLEAN NOT NULL DEFAULT true,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    from_email TEXT NOT NULL,
    from_name TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies for smtp_configs
ALTER TABLE smtp_configs ENABLE ROW LEVEL SECURITY;

-- Allow read access for service role and admin (Service role bypasses RLS)
CREATE POLICY "Admin can view SMTP configs"
    ON smtp_configs FOR SELECT
    USING (false);

-- Allow full access to admins
CREATE POLICY "Admin can manage SMTP configs"
    ON smtp_configs FOR ALL
    USING (false)
    WITH CHECK (false);

-- ==============================================
-- DOWNLOAD TRACKING
-- ==============================================
CREATE OR REPLACE FUNCTION increment_download_count(order_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE orders
  SET download_count = COALESCE(download_count, 0) + 1
  WHERE id = order_id;
END;
$$ LANGUAGE plpgsql;
