# DAEVIK — Project Creation Blueprint

> **Purpose:** This document is the single source of truth for creating new projects (products/funnels) on the Daevik platform. Attach this file to any future conversation and only describe the **page style and content** — everything else follows this blueprint automatically.

---

## 1. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | 16.3.x |
| **Language** | TypeScript | 5.x |
| **UI** | React | 19.x |
| **Styling** | Inline `<style>` blocks per page + `globals.css` for shared styles |
| **Database** | Supabase PostgreSQL (service-role key, server-side only) |
| **File Storage** | Supabase Storage (proxied via `/cdn/` rewrite) |
| **Authentication** | NextAuth v5 (beta) — admin panel only |
| **Payments** | Razorpay, PayU, PayPal (configurable per product via `gateway_provider`) |
| **Email** | Nodemailer (SMTP) + Resend (fallback) |
| **Tracking** | Facebook Pixel (client-side) + Facebook CAPI (server-side) |
| **Deployment** | Vercel (auto-deploy from `main` branch on GitHub) |
| **Package Manager** | npm |

---

## 2. Project Directory Structure

```
daevik-app/
├── next.config.ts                  # Rewrites, headers, security
├── src/
│   ├── proxy.ts                    # Middleware (auth + domain routing)
│   ├── app/
│   │   ├── layout.tsx              # Root layout (FacebookPixel, globals.css)
│   │   ├── globals.css             # Shared CSS design system
│   │   ├── page.tsx                # Homepage (product listing, SSR + ISR)
│   │   ├── product/
│   │   │   ├── [slug]/page.tsx     # Dynamic product/landing page
│   │   │   └── {slug}/page.tsx     # ⭐ STATIC landing pages (per product)
│   │   ├── checkout/
│   │   │   ├── [slug]/page.tsx     # Dynamic checkout page
│   │   │   └── {slug}/page.tsx     # ⭐ STATIC checkout pages (per product)
│   │   ├── thank-you/
│   │   │   └── [slug]/page.tsx     # Post-purchase page (download + tracking)
│   │   ├── confirmation/page.tsx   # Generic confirmation fallback
│   │   ├── admin/                  # Admin panel (protected)
│   │   │   ├── layout.tsx          # Admin sidebar layout
│   │   │   ├── page.tsx            # Dashboard
│   │   │   ├── orders/             # Order management
│   │   │   ├── products/           # Digital file management
│   │   │   ├── projects/           # Product/funnel configurator
│   │   │   ├── payments/           # Gateway configuration
│   │   │   ├── emails/             # Email template management
│   │   │   ├── facebook/           # FB Pixel/CAPI configuration
│   │   │   ├── seo/                # SEO settings
│   │   │   ├── analytics/          # Funnel analytics
│   │   │   └── login/              # Admin login
│   │   └── api/
│   │       ├── payments/create-order/  # Order creation + gateway routing
│   │       ├── products/[slug]/        # Public product API
│   │       ├── customers/me/           # Customer session API
│   │       ├── webhooks/
│   │       │   ├── razorpay/           # Razorpay webhook
│   │       │   ├── payu/              # PayU webhook
│   │       │   └── paypal/            # PayPal webhook
│   │       ├── track/                 # FB Pixel ID endpoint
│   │       │   ├── pixel/             # Returns pixel ID
│   │       │   └── capi/              # Server-side CAPI events
│   │       ├── email/send/            # Email dispatch
│   │       └── admin/                 # Protected admin APIs
│   ├── components/
│   │   ├── FacebookPixel.tsx       # Client-side FB Pixel loader
│   │   └── TrackPurchase.tsx       # Purchase event tracker
│   └── lib/
│       ├── supabase.ts             # Supabase client (server-side only)
│       ├── database.types.ts       # TypeScript types for all tables
│       ├── auth.ts                 # NextAuth configuration
│       ├── email.ts                # Email service (SMTP + Resend)
│       ├── facebook-capi.ts        # Server-side FB CAPI
│       ├── fb-client.ts            # Client-side FB event helper
│       ├── funnel.ts               # Funnel event logging
│       ├── utils.ts                # URL hiding utilities
│       └── payments/
│           ├── razorpay.ts         # Razorpay SDK integration
│           ├── payu.ts             # PayU integration
│           └── paypal.ts           # PayPal integration
├── public/
│   └── product-images/             # Static product images
└── supabase/
    └── schema.sql                  # Database schema
```

---

## 3. Database Schema (Supabase PostgreSQL)

### Tables

| Table | Purpose |
|---|---|
| `products` | Stores all projects/funnels. Each has: `name`, `slug`, `price`, `description`, `tag`, `thumbnail_url`, `landing_page_html`, `product_file_url`, `gateway_provider`, `checkout_config` (JSON), `seo_title`, `seo_description`, `og_image_url`, `status` |
| `customers` | `name`, `email`, `phone` |
| `orders` | Links `product_id` + `customer_id`. Tracks: `amount`, `currency`, `gateway_used`, `payment_status`, `transaction_id`, `gateway_order_id`, `gateway_response` |
| `gateway_configs` | Per-provider config: `api_key`, `api_secret`, `webhook_secret`, `active` |
| `email_templates` | Customizable email templates with `{{placeholder}}` support |
| `email_logs` | Delivery tracking with retry status |
| `funnel_events` | Analytics: `page_view`, `checkout_start`, `purchase`, `abandoned` |
| `fb_capi_config` | Facebook Pixel ID + access token per product |
| `smtp_configs` | SMTP server configuration |
| `admin_users` | Admin login credentials (bcrypt hashed) |

### Key Relationships
- `orders.product_id` → `products.id`
- `orders.customer_id` → `customers.id`
- `orders.gateway_used` ∈ `('razorpay', 'payu', 'paypal')`
- `products.gateway_provider` ∈ `('razorpay', 'payu', 'paypal')`
- `products.status` ∈ `('live', 'draft', 'archived')`

---

## 4. Pages Required Per New Project

When creating a new project (e.g., `my-new-product`), create these pages:

### 4.1 Landing / Product Page
**Path:** `src/app/product/{slug}/page.tsx`
- `'use client'` directive
- Contains all product marketing content
- **Sections to include** (standard template):
  1. Sticky Top Bar (with CTA)
  2. Hero Section (headline, subheadline, product mockup image, CTA button, price)
  3. Problem/Agitation Section
  4. What You Get (feature cards)
  5. Value Stack (price breakdown)
  6. Who This Is For (target audience grid)
  7. How It Works (step-by-step)
  8. What Makes This Different (credibility grid)
  9. Inside The Book/Product (preview grid)
  10. Who This Is NOT For (honesty section)
  11. FAQ (accordion)
  12. Final Sales Section (last CTA with price)
  13. Footer (copyright, links)
  14. Sticky Mobile CTA (fixed bottom bar)
- **All CSS is inline** via `<style dangerouslySetInnerHTML>` — self-contained per page
- Must include `CHECKOUT_URL` constant pointing to `/checkout/{slug}`
- Must fire Facebook CAPI `PageView` on load:
  ```tsx
  useEffect(() => {
    fetch('/api/track/capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'PageView', url: window.location.href }),
    }).catch(() => {});
  }, []);
  ```
- Product image stored in `public/product-images/{slug}.jpg`

### 4.2 Checkout Page
**Path:** `src/app/checkout/{slug}/page.tsx`
- `'use client'` directive
- Hardcoded product info (name, price, slug, gateway_provider)
- Form fields: Name, Email, Phone
- Saves form data to `localStorage` for persistence
- Also loads from URL params (`?name=&email=&phone=`) for funnel compatibility
- Also loads from server session (`/api/customers/me`) for returning customers
- On submit:
  1. Fires `trackFbEvent('InitiateCheckout', ...)`
  2. POSTs to `/api/payments/create-order`
  3. Routes to appropriate gateway based on response:
     - `razorpay` → Opens Razorpay checkout modal
     - `payu` → Submits PayU form
     - `pp` → Redirects to PayPal approve URL
- Must include security trust badges (Shield, Lock, Zap icons)
- All CSS is inline via `<style dangerouslySetInnerHTML>`

### 4.3 Thank You / Download Page
**Path:** Uses the existing dynamic `src/app/thank-you/[slug]/page.tsx`
- Server-side rendered (no `'use client'`)
- Verifies order via `orderId` query param
- Fetches the attached digital product file URL
- Renders download button + order details
- Fires `TrackPurchase` component for FB Pixel deduplication

### 4.4 Product Image
**Path:** `public/product-images/{slug}.jpg`
- High-quality product mockup/thumbnail
- Used on landing page hero + checkout page + homepage grid

---

## 5. Payment Flow

```
Customer fills checkout form
        ↓
POST /api/payments/create-order
  → Looks up product by slug
  → Creates/finds customer in DB
  → Fetches gateway_configs for product's gateway_provider
  → Creates gateway-specific order (Razorpay/PayU/PayPal)
  → Inserts order row (status: 'pending')
  → Sets customer session cookie
  → Returns gateway data to frontend
        ↓
Frontend routes to gateway checkout
        ↓
Customer completes payment
        ↓
Gateway sends webhook → /api/webhooks/{provider}
  → Verifies signature (timing-safe HMAC-SHA256)
  → Idempotency check (skip if already 'completed')
  → Updates order status to 'completed'
  → Sends product delivery email
  → Fires Facebook CAPI Purchase event
  → Logs funnel 'purchase' event
        ↓
Customer redirected to /thank-you/{slug}?orderId=xxx
```

---

## 6. Tracking & Analytics

### Facebook Pixel (Client-Side)
- `FacebookPixel.tsx` component in root layout
- Fetches pixel ID from `/api/track/pixel` (server-managed)
- Auto-fires `PageView` on every route change

### Facebook CAPI (Server-Side)
- Events fired from API routes / webhooks
- Deduplication via `eventId` (e.g., `purchase_{orderId}`)
- Per-product pixel configuration via `checkout_config.fb_pixel_id`

### Funnel Events
- `page_view`, `checkout_start`, `purchase`, `abandoned`
- Logged to `funnel_events` table via `logFunnelEvent()`

---

## 7. Email System

- **Primary:** Nodemailer via SMTP (configured in `smtp_configs` table from admin panel)
- **Fallback:** Resend API
- **Templates:** Stored in `email_templates` table with `{{placeholder}}` syntax
- **Variables available:**
  - `{{customer_name}}`, `{{customer_email}}`
  - `{{product_name}}`, `{{product_price}}`
  - `{{download_link}}`, `{{order_id}}`
- **Retry logic:** Up to 3 attempts, logged in `email_logs`

---

## 8. Security Rules (NEVER VIOLATE)

- [ ] `poweredByHeader: false` in `next.config.ts`
- [ ] HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy headers set globally
- [ ] All Supabase calls use server-side `SUPABASE_SERVICE_ROLE_KEY` — NEVER exposed to client
- [ ] Webhook secrets loaded from `process.env` — NOT from database for Razorpay
- [ ] Webhook signatures verified with `crypto.timingSafeEqual`
- [ ] API error responses are sanitized — never expose stack traces or DB errors
- [ ] Input validation on all POST endpoints (length checks, email regex)
- [ ] Customer session via `httpOnly` + `secure` + `sameSite: 'lax'` cookie
- [ ] Admin routes protected by NextAuth middleware
- [ ] `gateway_provider` value is NOT exposed in public API responses
- [ ] Payment gateway names are obfuscated in frontend JS bundles (e.g., `'pp'` not `'paypal'`)
- [ ] Facebook Pixel must NEVER be hidden or blocked
- [ ] `.env.example` maintained for documentation (gitignored)

---

## 9. Environment Variables

```bash
# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# NextAuth
AUTH_SECRET=
NEXT_PUBLIC_ADMIN_DOMAIN=admin.daevik.in
NEXT_PUBLIC_MAIN_DOMAIN=daevik.in
NEXT_PUBLIC_APP_URL=https://daevik.in

# Razorpay Webhook (server-side only — NOT in gateway_configs DB)
RAZORPAY_WEBHOOK_SECRET=

# Email (optional if using SMTP from DB)
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@daevik.in
```

> ⚠️ **NEVER** prefix secrets with `NEXT_PUBLIC_`

---

## 10. Admin Panel Features

The admin panel at `/admin` (or `admin.daevik.in`) provides:

| Section | Purpose |
|---|---|
| Dashboard | Revenue, orders, conversion stats |
| Orders | View all orders with status |
| Products | Upload/manage digital files (PDFs, etc.) |
| Projects | Configure funnels: price, gateway, FB pixel, attached product |
| Payments | Configure Razorpay/PayU/PayPal API keys |
| Emails | Manage email templates |
| Facebook | Configure FB Pixel + CAPI access tokens |
| SEO | Product SEO metadata |
| Analytics | Funnel analytics (views → checkouts → purchases) |

---

## 11. Coding Conventions

### Pages
- Static product/checkout pages use `'use client'` with inline `<style>` blocks
- Dynamic pages use `[slug]` folder convention
- All CSS variables follow the existing design system in `globals.css`
- No Tailwind utility classes in production pages — use explicit CSS
- Color palette per product defined in `:root` CSS variables within inline styles

### API Routes
- All in `src/app/api/` using Next.js App Router convention
- Export named functions: `GET`, `POST`, `PUT`, `DELETE`
- Always return `NextResponse.json()`
- Always wrap in try/catch with sanitized error messages
- Admin APIs check authentication via session

### Components
- Minimal shared components — pages are self-contained
- SVG icons defined inline within each page (not imported from icon libraries)
- No external icon packages (lucide, heroicons, etc.)

### Images
- Product images go in `public/product-images/`
- No `onError` fallback handlers on `<img>` tags (causes infinite loops)
- Use standard `<img>` tags, not Next.js `<Image>` component in landing pages

---

## 12. Deployment Checklist for New Projects

1. Create landing page: `src/app/product/{slug}/page.tsx`
2. Create checkout page: `src/app/checkout/{slug}/page.tsx`
3. Add product image: `public/product-images/{slug}.jpg`
4. Create product in Admin → Projects (set price, gateway, FB pixel)
5. Upload digital file in Admin → Products
6. Attach digital file to project in Admin → Projects → Config
7. Verify gateway is configured and active in Admin → Payments
8. Verify SMTP is configured in Admin → Emails
9. Test the full flow: Landing → Checkout → Payment → Email → Thank You
10. `npm run build` (must compile without errors)
11. `git add . && git commit && git push` (auto-deploys to Vercel)

---

## 13. What YOU Provide (User Input)

When creating a new project, you only need to tell me:

1. **Product name and slug** (e.g., "Instagram Growth Guide" → `instagram-growth-guide`)
2. **Price** (e.g., ₹249)
3. **Target audience** (e.g., "College students wanting to grow on Instagram")
4. **Page style/design preferences** (colors, vibe, sections you want)
5. **Product content** (what's included, features, FAQs)
6. **Product image** (attach one, or describe what you want generated)
7. **Payment gateway** to use (Razorpay / PayU / PayPal) — defaults to Razorpay

Everything else — the code structure, payment integration, email delivery, tracking, security, admin wiring, deployment — is handled automatically per this blueprint.

---

*Last updated: August 2026*
*Platform: Daevik (daevik.in)*
