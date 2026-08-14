# Daevik.in — UI/UX Requirements

## 0. Brand & Visual Identity
The overall site UI (home page, admin panel, shared UI elements) must visually align with the **Daevik logo**, not just reference the brand name. Color palette and styling should be derived directly from the logo's colors:

- **Primary Color — Deep Maroon/Burgundy** (from the wordmark "Daevik" and the meditating figure silhouette): use for primary buttons, headings, active nav states, and key CTAs.
- **Secondary Color — Golden/Mustard Yellow** (from the triangular sacred-geometry pattern): use for accents, highlights, hover states, borders, and icons.
- **Accent Colors — Chakra Spectrum** (small dots along the figure's spine: red, orange, yellow, green, blue, indigo, violet): use sparingly, only for small accent details, status indicators, or data-viz chart colors — never as large fill areas, to keep the UI clean rather than busy.
- **Background:** Neutral off-white/cream or white, so maroon and gold stand out clearly (avoid dark backgrounds that clash with the logo's warm palette).
- **Typography:** Headings can echo the logo's serif wordmark style (elegant serif font) for brand consistency on the home page/marketing surfaces; admin panel can use a clean sans-serif for readability, while still using the maroon/gold color system.

This palette applies to the home page, checkout page, confirmation page, and admin panel UI — not to individual product landing pages, which remain fully custom per product as defined in Feature Requirements.

## 1. Customer-Facing Site
- **Home Page:** Clean, minimal product catalog styled in the maroon/gold brand palette — should load fast (this is the one shared/templated page in the customer experience). Responsive grid for mobile and desktop.
- **Product Landing Pages:** No enforced UI system — each is a self-contained upload. Platform must render these independently (e.g., as isolated routes/iframes/static assets) without leaking home page styles into them, and vice versa.
- **Checkout Page:** Should feel trustworthy and fast — minimal fields, visible security/payment trust badges, clear price breakdown, mobile-first design since majority of digital product traffic is typically mobile. Uses brand palette (maroon CTA button, gold accents) so it still feels connected to Daevik even though product landing pages vary.
- **Confirmation Page:** Clear success message, order ID, note that product has been emailed, support contact info — styled in brand palette.
- **Performance:** Landing pages and checkout must load quickly (under 2–3 seconds) since slow load directly affects conversion.

## 2. Admin Panel
- **Simplicity over complexity:** Dashboard-style layout — sidebar navigation (Dashboard, Products, Orders/Customers, Emails, Payments, Facebook CAPI, SEO, Settings). Sidebar/header use the maroon and gold brand palette; content area stays neutral for readability.
- **Data-first design:** Tables, charts (simple bar/line for sales trends), and funnel visualizations (simple funnel chart) — not visual design tools.
- **No WYSIWYG page builder** anywhere in admin — reinforced as a hard UX constraint per product philosophy.
- **Responsive but desktop-primary:** Admin panel is expected to be used mostly on desktop; should still be usable on tablet.
- **Clear feedback states:** Loading, success, and error states for every admin action (especially payment/email config, since mistakes here directly affect revenue).
