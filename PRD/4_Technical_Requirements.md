# Daevik.in — Technical Requirements

## 1. Architecture
- **Frontend:** Next.js (App Router recommended) — handles home page, dynamic product landing page rendering, checkout UI, and admin panel UI.
- **Backend:** Node.js (Express/Fastify or Next.js API routes/serverless functions) — handles payment gateway integration, webhook processing, email automation, Facebook CAPI event dispatch, and admin CRUD APIs.
- **Database:** Supabase (PostgreSQL) — stores products, orders, customers, email templates, gateway configs, SEO metadata, and analytics events.
- **Admin Authentication:** NextAuth.js handles admin login (Credentials provider, or Email/OAuth provider as needed), session management via JWT, and route protection — decoupled from Supabase Auth. Supabase is used purely as the data layer, accessed via the Node.js backend using a service-role key (never exposed to the frontend).

## 2. Core Data Models (Supabase Tables — indicative)
- `products` — id, name, slug, price, landing_page_url/asset, checkout_config, product_file_url, gateway_provider, seo_title, seo_description, og_image, status (live/draft), created_at
- `orders` — id, product_id, customer_id, amount, gateway_used, payment_status, transaction_id, created_at
- `customers` — id, name, email, phone (optional), created_at
- `funnel_events` — id, product_id, session_id, event_type (view/checkout_start/purchase/abandoned), timestamp
- `email_templates` — id, name, subject, body, sender_name, updated_at
- `email_logs` — id, order_id, status (sent/failed), sent_at
- `gateway_configs` — id, provider, api_key, api_secret, webhook_secret, active
- `fb_capi_config` — pixel_id, access_token, test_event_code

## 3. Payment Gateway Integration
- Separate integration modules for Razorpay, PayU, and PayPal (standard checkout + webhook listener endpoints for each).
- Webhook signature verification mandatory for all three.
- Idempotency handling to prevent duplicate order creation on webhook retries.

## 4. Email Automation
- Backend email service (e.g., via Node.js with a transactional email provider such as Resend, SendGrid, or Amazon SES) triggered on confirmed payment webhook.
- Template rendering engine to support dynamic placeholders.
- Retry logic for failed email sends, with admin visibility into failures.

## 5. Facebook Conversions API
- Server-side event dispatch from Node.js backend (not just client-side Pixel) for accuracy and ad-blocker resistance.
- Events: PageView, InitiateCheckout, Purchase — deduplicated against client-side Pixel using event IDs if client Pixel is also used.
- Hashed PII (email, phone) as required by Facebook CAPI spec.

## 6. Security
- Supabase Row Level Security (RLS) policies — combined with backend-only service-role access, since admin auth is now handled outside Supabase Auth.
- Admin routes/pages protected via NextAuth middleware in Next.js (session checks on both client and server/API routes).
- Admin credentials (or OAuth accounts) stored securely; passwords hashed if using Credentials provider.
- API keys/secrets (payment gateways, Supabase service role, FB CAPI token, NextAuth secret) stored server-side only (never exposed to frontend), managed via environment variables.
- HTTPS enforced; webhook endpoints validated via signature/secret checks.

## 7. Hosting & Infrastructure (indicative)
- Frontend: Vercel (native Next.js support).
- Backend: Node.js service — either as Next.js API routes/serverless functions on Vercel, or a separate Node server (Railway/Render) if long-running webhook processing is needed.
- Database: Supabase managed PostgreSQL.
- File storage: Supabase Storage (for product files, landing page assets, OG images) or external CDN.

## 8. Analytics/Funnel Tracking Implementation
- Lightweight event logging (`funnel_events` table) triggered from frontend (page view, checkout start) and backend (purchase confirmation, abandoned cart detection via timeout logic).
- Admin dashboard queries aggregate this data into funnel visualizations.
