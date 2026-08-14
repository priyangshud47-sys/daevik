# Daevik.in — Feature Requirements

## 1. Customer-Facing Website
- **Home Page:** Grid/list of all live products (thumbnail, name, price, short tag). Clicking a product routes to that product's unique landing page URL/slug.
- **Product Landing Pages:** Each product's landing page is a standalone page (custom HTML/design uploaded by admin), with its own layout — no forced global header/footer.
- **Checkout Page:** Product-specific checkout page capturing customer name, email, and payment details.
- **Payment Gateway Routing:** At checkout, the system routes the customer to the gateway assigned to that specific product (Razorpay, PayU, or PayPal).
- **Order Confirmation Page:** Simple post-payment confirmation/thank-you screen.
- **Abandoned Cart Capture:** Track when a customer starts checkout but does not complete payment (for funnel analytics; no forced recovery emails required initially, but data must be captured).

## 2. Payments
- Multi-gateway support: **Razorpay, PayU, PayPal**.
- Gateway selection is configured **per product** in the admin panel.
- Each gateway integration must handle: payment success, payment failure, and refund/webhook events.
- Secure webhook verification for each gateway (signature validation).

## 3. Order Fulfillment (Automated Email)
- On successful payment, trigger an automated email to the customer containing the purchased product (file/download link).
- Email template must be editable from the admin panel (subject, sender name, body content, placeholders like {{customer_name}}, {{product_name}}).
- Product file attachment/link is configured per product in the admin panel.
- Email delivery status (sent/failed) should be logged and visible to admin.

## 4. Marketing & Tracking
- **Facebook Conversions API (CAPI):** Server-side event tracking for PageView, InitiateCheckout, Purchase (and optionally AddToCart/abandoned).
- CAPI access token, Pixel ID, and event configuration manageable from admin panel.
- **SEO Management:** Per-product meta title, meta description, OG image, and slug/URL editable from admin panel.

## 5. Admin Panel
- **Authentication:** Secure admin login via NextAuth (credentials-based or email/OAuth provider), with session/JWT handling and single or multi-admin role support.
- **Dashboard/Sales Overview:** Today's sales (count + revenue), total sales (count + revenue), recent transactions list.
- **Product Management:** Add/edit/deactivate products — name, slug, price, landing page upload/link, checkout page config, attached product file, gateway selection, SEO fields. (No visual page builder — just metadata and file/link management.)
- **Funnel Analytics:** Landing page views → checkout initiated → purchase completed → abandoned cart count, shown per product and site-wide.
- **Email Template Management:** Editable automated email template(s), sender name, test-send option.
- **Payment Gateway Settings:** Store/manage API keys per gateway; assign gateway per product.
- **Facebook CAPI Settings:** Pixel ID, access token, test event code.
- **SEO Settings:** Per-product SEO field editor.
- **Customer Database:** List of all customers with name, email, product purchased, amount, date, payment status; searchable/filterable; exportable (CSV).
