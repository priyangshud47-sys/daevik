# 🚀 DAEVIK — New Project Brief Template

> **HOW TO USE:** Fill in the `## PROJECT DETAILS` section below and attach this entire file to a new Antigravity chat. The AI will use it to build everything automatically.
> Also attach the `DAEVIK_PROJECT_BLUEPRINT.md` file alongside this for full platform context.

---

## PROJECT DETAILS
> ✏️ Fill these in before attaching to chat

```
PRODUCT NAME        : [e.g., Instagram Growth Masterclass]
SLUG                : [e.g., instagram-growth-masterclass]   ← lowercase, hyphens only
PRICE (₹)          : [e.g., 499]
GATEWAY             : [razorpay / payu / cashfree]           ← default: cashfree

TARGET AUDIENCE     : [e.g., College students who want to grow on Instagram organically]
CORE PROMISE        : [e.g., Gain your first 1000 real followers in 30 days without paid ads]
PRODUCT FORMAT      : [PDF / Video / ZIP / etc.]

COLOR THEME         : [e.g., Purple & Gold / Deep Blue & White / Dark Green & Orange]
VIBE / FEEL         : [e.g., Premium & Aspirational / Energetic & Youth / Trust & Professional]

WHAT'S INCLUDED     :
  - [Feature 1, e.g., 10-chapter PDF guide]
  - [Feature 2, e.g., 30-day action plan sheet]
  - [Feature 3, e.g., 5 plug-and-play caption templates]
  - [Feature 4]

FAQS                :
  - Q: [Question 1] | A: [Answer 1]
  - Q: [Question 2] | A: [Answer 2]
  - Q: [Question 3] | A: [Answer 3]

TESTIMONIALS        : [Optional — paste real reviews or write placeholder names]
  - "[Quote]" — [Name], [City]

URGENCY/SCARCITY    : [Optional — e.g., "Price goes up to ₹999 on Sept 1"]

SEO TITLE           : [e.g., Instagram Growth Masterclass — Gain 1000 Followers in 30 Days]
SEO DESCRIPTION     : [e.g., The step-by-step guide for Indian creators to grow organically...]
```

### 📎 Attachments
> Attach these files alongside this .md in the chat

- `thumbnail.jpg` — Product mockup/cover image (used on sales page hero + checkout page)
- `product-file.pdf` — The actual digital product to deliver (uploaded via Admin → Products)

---

## WHAT WILL BE BUILT

The AI will create these from the details above:

| # | What | Path | Status |
|---|------|------|--------|
| 1 | **Sales / Landing Page** | `src/app/product/{slug}/page.tsx` | 🔨 Built by AI |
| 2 | **Checkout Page** | `src/app/checkout/{slug}/page.tsx` | 🔨 Built by AI |
| 3 | **Thank You Page** | `src/app/thank-you/[slug]/page.tsx` | ⚙️ **Dynamic** (Handles download + Pixel) |
| 4 | **Product Image** | `public/product-images/{slug}.jpg` | 🖼️ Saved from thumbnail |
| 5 | **Admin Setup** | Admin → Projects + Products | 📋 Step-by-step instructions |

> **IMPORTANT: Why the Thank You page is NOT built manually for new products:**
> According to the Daevik Blueprint, the Thank You page is **dynamically handled** by `src/app/thank-you/[slug]/page.tsx`. This single dynamic page securely verifies the order, fetches the product file, renders the download button, and fires the Facebook Pixel Purchase event deduplication for *all* products automatically. No new file is needed!

---

## TECH STACK (for AI context)

| Layer | Technology |
|---|---|
| Framework | Next.js 16.3.x (App Router) |
| Language | TypeScript 5.x |
| UI | React 19.x |
| Styling | Inline `<style>` blocks per page + `globals.css` for shared styles |
| Database | Supabase PostgreSQL (service-role key, server-side only) |
| File Storage | Supabase Storage (proxied via `/cdn/` rewrite) |
| Authentication | NextAuth v5 — admin panel only |
| Payments | Razorpay, PayU, Cashfree (configurable per product) |
| Email | Nodemailer (SMTP, primary) + Resend (fallback) |
| Tracking | Facebook Pixel (client-side) + Facebook CAPI (server-side) |
| Deployment | Vercel (auto-deploy from `main` branch on GitHub) |

---

## CONVENTIONS THE AI MUST FOLLOW

> ⚠️ Non-negotiable. These match the existing codebase exactly.

### Page Rules
- `'use client'` directive at the top of all product/checkout pages
- All CSS is **inline** using `<style dangerouslySetInnerHTML={{ __html: \`...\` }}>` — self-contained
- Color palette defined in `:root` inside the inline `<style>` block
- No Tailwind classes, no CSS modules, no external CSS imports in product/checkout pages
- No `next/image` — use plain `<img>` tags only
- No `onError` fallback handlers on `<img>` tags (causes infinite loop crashes)
- All SVG icons defined inline at the top of the file — no lucide, heroicons, or other packages
- Every CTA button on the sales page links to `CHECKOUT_URL = "/checkout/{slug}"`

### Sales Page — Required Sections (in this exact order)
1. **Sticky Top Bar** — Urgency text + CTA button
2. **Hero Section** — Big headline, sub-headline, product image, price, buy button with pulse animation
3. **Social Proof / Reviews Badge** — Star ratings + buyer count
4. **Problem / Agitation Section** — Pain points the target audience faces
5. **What You Get** — Feature cards with icons
6. **Value Stack** — Price breakdown showing what they're getting vs. the price
7. **Who This Is For** — Target audience grid
8. **How It Works** — Step-by-step numbered process
9. **Inside The Product** — Preview of what's inside (chapters, screenshots, etc.)
10. **Who This Is NOT For** — Honest section (builds trust)
11. **Testimonials** — 3–5 reviews with name and city
12. **FAQ** — Accordion style (click to expand)
13. **Final CTA Section** — Repeat buy button with urgency/scarcity
14. **Footer** — Copyright + quick links
15. **Sticky Mobile CTA** — Fixed bottom bar on mobile only

### Checkout Page Rules
- Hardcoded product info (name, price, slug, gateway) — no API fetch needed
- Form fields: Full Name, Email, Phone (use `react-phone-number-input` with auto country detection)
- Pre-fill form data in this priority: `localStorage` → URL params (`?name=&email=&phone=`) → `/api/customers/me`
- Save form data to `localStorage` on every input change for persistence
- On submit:
  1. Fire `trackFbEvent('InitiateCheckout', ...)` via `@/lib/fb-client`
  2. POST to `/api/payments/create-order`
  3. Route based on response:
     - `razorpay` → Open Razorpay checkout modal
     - `payu` → Submit PayU hidden form
     - `cashfree` → Redirect via Cashfree SDK / session URL
     - `pp` → Redirect to PayPal approve URL ← note: `'pp'` not `'paypal'` (obfuscated)
- Right panel: Show product image, name, price summary
- Must include security trust badges (Shield icon, Lock icon, Zap icon)
- All CSS is inline `<style dangerouslySetInnerHTML>`

### Facebook Tracking (mandatory on every sales page)
```tsx
useEffect(() => {
  fetch('/api/track/capi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'PageView', url: window.location.href }),
  }).catch(() => {});
}, []);
```
- Checkout fires `InitiateCheckout` via `trackFbEvent()` from `@/lib/fb-client` on form submit
- ❌ **NEVER block, remove, or conditionally skip Facebook Pixel or CAPI tracking**

### Security Rules
- No secrets prefixed with `NEXT_PUBLIC_`
- No gateway keys, file URLs, or service role keys in public-facing API responses
- All user inputs length-validated and regex-checked before any DB operation
- Customer session cookie: `httpOnly: true`, `secure: true`, `sameSite: 'lax'`
- Webhook signature verified with `crypto.timingSafeEqual` before processing

---

## PRODUCT IMAGE CONVENTION

```
public/product-images/{slug}.jpg
```
Save the attached `thumbnail.jpg` with this exact filename. Both the sales page and checkout page reference it at `/product-images/{slug}.jpg`.

---

## PAYMENT FLOW REFERENCE

```
Customer fills checkout form
        ↓
POST /api/payments/create-order
  → Validates inputs (length, email regex)
  → Looks up product by slug (status: 'live' only)
  → Creates/finds customer in DB
  → Fetches active gateway config from gateway_configs table
  → Creates gateway-specific order (Razorpay/PayU/Cashfree)
  → Inserts order row (status: 'pending')
  → Sets httpOnly customer session cookie
  → Returns gateway data to frontend
        ↓
Frontend routes to gateway checkout
        ↓
Customer completes payment
        ↓
Webhook → /api/webhooks/{provider}
  → Verifies HMAC signature (timing-safe)
  → Idempotency check (skip if already 'completed')
  → Updates order to 'completed' + saves transaction_id
  → Generates invoice PDF
  → Sends product delivery email with download link
  → Fires Facebook CAPI Purchase event
  → Logs funnel 'purchase' event
        ↓
Customer lands on /thank-you/{slug}?orderId=xxx
  → Verifies session cookie matches customer_id on order
  → Verifies payment_status === 'completed'
  → Generates 60-second signed Supabase Storage URL
  → Shows download button (max 5 downloads enforced)
```

---

## DATABASE SCHEMA (key tables)

| Table | Key Fields |
|---|---|
| `products` | `name`, `slug`, `price`, `description`, `thumbnail_url`, `product_file_url`, `gateway_provider`, `checkout_config` (JSON: fb_pixel_id, fb_access_token), `status` ('live'/'draft'/'archived') |
| `customers` | `name`, `email`, `phone` |
| `orders` | `product_id`, `customer_id`, `amount`, `currency`, `gateway_used`, `payment_status`, `transaction_id`, `gateway_order_id`, `gateway_response`, `download_count` |
| `gateway_configs` | `provider`, `api_key`, `api_secret`, `webhook_secret`, `active`, `extra_config` (JSON: mode 'test'/'live') |
| `funnel_events` | `product_id`, `session_id`, `event_type` ('page_view'/'checkout_start'/'purchase'/'abandoned') |
| `email_templates` | HTML templates with `{{customer_name}}`, `{{product_name}}`, `{{download_link}}`, `{{order_id}}` |

---

## ADMIN SETUP CHECKLIST
> Complete these steps in the admin panel at `admin.daevik.in` after the AI builds the pages

- [ ] **Admin → Products** — Upload the digital product file (PDF/ZIP)
- [ ] **Admin → Projects** — Create project entry:
  - Name: `{product name}`
  - Slug: `{slug}`
  - Price: `₹{price}`
  - Status: `live`
  - Gateway: `{cashfree / razorpay / payu}`
  - FB Pixel ID + Access Token (from your Facebook Business Manager)
  - Thumbnail URL: upload or link the product image
  - Attach the uploaded product file
- [ ] **Admin → Payments** — Verify gateway is configured and `active = true`
- [ ] **Admin → Emails** — Verify SMTP is configured; send a test email
- [ ] **Admin → SEO** — Set SEO title, description, and OG image for the product slug
- [ ] **Test the full flow**: Landing page → Checkout → Payment → Delivery Email → Thank You page
- [ ] Run `npm run build` — must compile with zero TypeScript errors
- [ ] `git add . && git commit -m "feat: add {slug} product pages" && git push`
- [ ] Verify Vercel deployment succeeded at `daevik.in/product/{slug}`

---

## PROMPT TO GIVE THE AI

After filling in the PROJECT DETAILS above and attaching this file + `DAEVIK_PROJECT_BLUEPRINT.md` + your thumbnail image, use this exact prompt:

```
I've attached the project brief and thumbnail image.
Build the sales page and checkout page for this product following ALL conventions in the brief.
The product slug is: {slug}
Reference the existing zero-investment-guide pages for structure and quality level.
After building, give me the exact admin setup steps to complete the launch.
```

---

## EXAMPLE REFERENCE (study before building)

The existing `zero-investment-guide` is the gold-standard implementation:
- **Sales page:** `src/app/product/zero-investment-guide/page.tsx`
- **Checkout page:** `src/app/checkout/zero-investment-guide/page.tsx`
- **Product image:** `public/product-images/zero-investment-guide.jpg`

Match its structure, section depth, copy quality, and CSS architecture exactly.

---

*Platform: Daevik (daevik.in) · Last updated: August 2026*
