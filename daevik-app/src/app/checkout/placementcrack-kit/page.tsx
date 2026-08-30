'use client';
import Link from 'next/link';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackFbEvent } from '@/lib/fb-client';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const CheckCircle = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ZapIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

function CheckoutContent() {
  const slug = 'placementcrack-kit';

  // Hardcoded product info
  const product = {
    id: 'placementcrack-kit',
    name: 'PlacementCrack Kit',
    slug: 'placementcrack-kit',
    price: 199,
    description: 'The all-in-one digital bundle covering 30+ companies, aptitude, coding, and interview prep.',
    thumbnail_url: '/product-images/placementcrack-kit.jpg',
    gateway_provider: 'razorpay',
  };

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState<any>('IN');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const searchParams = useSearchParams();

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.country_code) {
          setCountry(data.country_code);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const urlName = searchParams.get('name') || searchParams.get('first_name');
    const urlEmail = searchParams.get('email');
    const urlPhone = searchParams.get('phone') || searchParams.get('tel');

    const savedName = localStorage.getItem('daevik_checkout_name');
    const savedEmail = localStorage.getItem('daevik_checkout_email');
    const savedPhone = localStorage.getItem('daevik_checkout_phone');

    if (urlName || urlEmail || urlPhone || savedName || savedEmail || savedPhone) {
      setFormData(prev => ({
        ...prev,
        name: urlName || savedName || prev.name,
        email: urlEmail || savedEmail || prev.email,
        phone: urlPhone || savedPhone || prev.phone,
      }));
    }

    async function fetchCustomerData() {
      try {
        const res = await fetch('/api/customers/me');
        if (res.ok) {
          const { customer } = await res.json();
          if (customer) {
            setFormData(prev => ({
              ...prev,
              name: prev.name || customer.name || '',
              email: prev.email || customer.email || '',
              phone: prev.phone || customer.phone || '',
            }));
            
            if (customer.name) localStorage.setItem('daevik_checkout_name', customer.name);
            if (customer.email) localStorage.setItem('daevik_checkout_email', customer.email);
            if (customer.phone) localStorage.setItem('daevik_checkout_phone', customer.phone);
          }
        }
      } catch (err) {
        console.error('Failed to load prefill data', err);
      }
    }
    fetchCustomerData();
  }, [searchParams]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    localStorage.setItem(`daevik_checkout_${field}`, value);
  };

  const checkoutEventId = React.useRef(`checkout_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const checkoutEventFired = React.useRef(false);

  useEffect(() => {
    const sessionId = sessionStorage.getItem('daevik_session') || `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem('daevik_session', sessionId);

    if (checkoutEventFired.current) return;
    checkoutEventFired.current = true;

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        sessionId,
        eventType: 'checkout_start',
      }),
    }).catch(() => {});

    trackFbEvent('InitiateCheckout', {
      value: product.price,
      currency: 'INR',
      content_name: product.name,
      content_ids: [product.id],
      content_type: 'product',
    }, { eventID: checkoutEventId.current });
  }, [product.id, product.name, product.price]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentError = params.get('error');
    if (paymentError) {
      setError('Payment failed. Please try again.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    setError(null);

    if (!formData.phone || !isValidPhoneNumber(formData.phone)) {
      setError('Please enter a valid phone number for your country.');
      setSubmitting(false);
      return;
    }

    try {
      // Read FB cookies for CAPI match quality
      const getCookie = (name: string) => {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : undefined;
      };
      const fbp = getCookie('_fbp');
      const fbc = getCookie('_fbc');

      // Second enriched CAPI InitiateCheckout — now we have the user's data
      const sessionId = sessionStorage.getItem('daevik_session') || '';
      const nameParts = formData.name.trim().split(' ');
      const userFirstName = nameParts[0] || '';
      const userLastName = nameParts.slice(1).join(' ') || '';
      fetch('/api/track/capi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'InitiateCheckout',
          eventId: checkoutEventId.current,
          url: window.location.href,
          productName: product.name,
          productId: product.id,
          value: product.price,
          currency: 'INR',
          externalId: sessionId,
          userEmail: formData.email,
          userPhone: formData.phone,
          userFirstName,
          userLastName,
          fbp,
          fbc,
        }),
      }).catch(() => {});

      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSlug: product.slug,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          fbp,
          fbc,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      switch (data.gateway) {
        case 'razorpay':
          await handleRazorpayCheckout(data);
          break;
        case 'payu':
          handlePayUCheckout(data);
          break;
        case 'pp':
          window.location.href = data.approveUrl;
          break;
        case 'cashfree':
          await handleCashfreeCheckout(data);
          break;
        default:
          throw new Error('Unsupported payment gateway');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  const handleCashfreeCheckout = async (data: any) => {
    const launchModal = () => {
      try {
        const cf = (window as unknown as any).Cashfree({
          mode: data.mode === 'live' ? 'production' : 'sandbox',
        });

        const checkoutOptions = {
          paymentSessionId: data.paymentSessionId,
          redirectTarget: '_modal',
        };

        cf.checkout(checkoutOptions).then(async (result: any) => {
          if (result && result.error) {
            setError(result.error.message || 'Payment failed or cancelled.');
            setSubmitting(false);
          }
          if (result && result.paymentDetails) {
            window.location.href = `/thank-you/placementcrack-kit?orderId=${data.orderId}`;
          }
        }).catch((err: any) => {
          setError(err?.message || 'Error launching Cashfree modal');
          setSubmitting(false);
        });
      } catch (err: any) {
        setError(err?.message || 'Failed to initialize Cashfree SDK');
        setSubmitting(false);
      }
    };

    if (typeof window !== 'undefined' && (window as any).Cashfree) {
      launchModal();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = launchModal;
    script.onerror = () => {
      setError('Failed to load Cashfree SDK');
      setSubmitting(false);
    };
  };

  const handleRazorpayCheckout = async (data: any) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const options = {
        key: data.razorpayKeyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Daevik',
        description: data.productName,
        order_id: data.razorpayOrderId,
        prefill: {
          name: data.customerName,
          email: data.customerEmail,
          contact: data.customerPhone,
        },
        theme: { color: '#4F46E5' },
        handler: function () {
          window.location.href = `/thank-you/${slug}?orderId=${data.orderId}`;
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
          },
        },
      };

      const rzp = new (window as unknown as any).Razorpay(options);
      rzp.open();
    };
  };

  const handlePayUCheckout = (data: any) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = data.formData.action;

    Object.entries(data.formData).forEach(([key, value]) => {
      if (key !== 'action') {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value as string;
        form.appendChild(input);
      }
    });

    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className="pc-checkout-page">
      {/* Top Security Bar */}
      <div className="pc-security-bar">
        <div className="pc-security-bar-inner">
          <span className="pc-security-item"><LockIcon /> 256-bit SSL Encrypted</span>
          <span className="pc-security-item"><ShieldIcon /> Secure Checkout</span>
          <span className="pc-security-item"><ZapIcon /> Instant Delivery</span>
        </div>
      </div>

      <div className="pc-checkout-wrapper">
        {/* Header with Logo + Back Link */}
        <div className="pc-checkout-header">
          <Link href="/product/placementcrack-kit" className="pc-back-link">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
            Back to Product Page
          </Link>
          <div className="pc-checkout-logo">
            <Link href="/product/placementcrack-kit">
              <span className="pc-logo-text">Dae<span className="pc-logo-accent">vik</span></span>
            </Link>
          </div>
          <div className="pc-breadcrumb">
            <Link href="/product/placementcrack-kit">PlacementCrack Kit</Link>
            <span className="pc-breadcrumb-sep">›</span>
            <span className="pc-breadcrumb-current">Checkout</span>
          </div>
        </div>

        <div className="pc-checkout-grid">
          {/* LEFT: Order Summary */}
          <div className="pc-order-summary animate-slide-right">
            <h2 className="pc-summary-title">Order Summary</h2>

            {/* Product Card */}
            <div className="pc-product-card">
              <div className="pc-product-image-wrap">
                <img
                  src="/product-images/placementcrack-kit.jpg"
                  alt="PlacementCrack Kit Bundle"
                  className="pc-product-image"
                />
              </div>
              <div className="pc-product-details">
                <span className="pc-product-badge">DIGITAL BUNDLE</span>
                <h3 className="pc-product-name">PlacementCrack Kit</h3>
                <p className="pc-product-tagline">Complete 30+ Companies Prep</p>
              </div>
            </div>

            {/* What's Included */}
            <div className="pc-included-section">
              <h4 className="pc-included-title">What&apos;s Included</h4>
              <ul className="pc-included-list">
                <li><CheckCircle /> <span>30+ Companies PYQ Vault</span></li>
                <li><CheckCircle /> <span>Aptitude & Reasoning Mastery</span></li>
                <li><CheckCircle /> <span>Top 100 Coding & Pseudocode Book</span></li>
                <li><CheckCircle /> <span>Interview Prep Playbook + Resume Templates</span></li>
              </ul>
            </div>

            {/* Price Breakdown */}
            <div className="pc-price-breakdown">
              <div className="pc-price-row">
                <span>PYQ Vault</span>
                <span className="pc-price-struck">₹499</span>
              </div>
              <div className="pc-price-row">
                <span>Aptitude Mastery</span>
                <span className="pc-price-struck">₹299</span>
              </div>
              <div className="pc-price-row">
                <span>Coding & Pseudocode</span>
                <span className="pc-price-struck">₹399</span>
              </div>
              <div className="pc-price-row">
                <span>Interview Playbook</span>
                <span className="pc-price-struck">₹299</span>
              </div>
              <div className="pc-price-divider" />
              <div className="pc-price-row pc-total-row">
                <span>Total Value</span>
                <span className="pc-price-struck">₹9,999</span>
              </div>
              <div className="pc-price-row pc-final-row">
                <span>You Pay Today</span>
                <span className="pc-final-price">₹199</span>
              </div>
              <div className="pc-savings-badge">🎉 You save ₹9,800 (98% off)</div>
            </div>

            {/* Guarantee */}
            <div className="pc-guarantee">
              <div className="pc-guarantee-icon">🛡️</div>
              <div>
                <strong>Student-Friendly Pricing</strong>
                <p>One-time payment of ₹199. No subscriptions. No hidden charges. Instant access after payment.</p>
              </div>
            </div>
          </div>

          {/* RIGHT: Payment Form */}
          <div className="pc-payment-section animate-slide-left">
            <div className="pc-payment-card">
              <h2 className="pc-payment-title">Complete Your Purchase</h2>
              <p className="pc-payment-subtitle">Fill in your details to get instant access</p>

              {/* Error */}
              {error && (
                <div className="pc-error-box">
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="pc-form">
                <div className="pc-form-group">
                  <label htmlFor="pc-name" className="pc-label">Full Name <span className="pc-required">*</span></label>
                  <input
                    id="pc-name"
                    type="text"
                    className="pc-input"
                    placeholder="Enter your full name"
                    autoComplete="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                <div className="pc-form-group">
                  <label htmlFor="pc-email" className="pc-label">Email Address <span className="pc-required">*</span></label>
                  <input
                    id="pc-email"
                    type="email"
                    className="pc-input"
                    placeholder="your@email.com"
                    autoComplete="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                  <span className="pc-hint">📩 Your kit will be delivered to this email</span>
                </div>

                <div className="pc-form-group">
                  <label htmlFor="pc-phone" className="pc-label">Phone Number <span className="pc-required">*</span></label>
                  {country && (
                    <PhoneInput
                      key={country}
                      id="pc-phone"
                      name="tel"
                      placeholder="Enter phone number"
                      defaultCountry={country}
                      value={formData.phone}
                      onChange={(val) => {
                        let newValue = val || '';
                        if (country === 'IN' && newValue.startsWith('+91') && newValue.length > 13) {
                          newValue = newValue.slice(0, 13);
                        }
                        handleInputChange('phone', newValue);
                      }}
                      required
                      limitMaxLength={true}
                      international={true}
                      countryCallingCodeEditable={false}
                      className="pc-phone-container"
                    />
                  )}
                </div>

                {/* Mobile Price Summary */}
                <div className="pc-mobile-price-box">
                  <div className="pc-mobile-price-inner">
                    <span>Total</span>
                    <span className="pc-mobile-price">₹199</span>
                  </div>
                </div>

                <button type="submit" className="pc-pay-btn" disabled={submitting}>
                  {submitting ? (
                    <span className="pc-btn-loading">
                      <span className="pc-spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }}></span>
                      Initializing...
                    </span>
                  ) : (
                    <>
                      <span>Complete Purchase</span>
                      <span className="pc-nested-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                      </span>
                    </>
                  )}
                </button>

                <p className="pc-pay-note">
                  Instant digital access after payment. No subscription.
                </p>
              </form>

              {/* Trust Badges */}
              <div className="pc-trust-row">
                <div className="pc-trust-badge">
                  <ShieldIcon />
                  <span>Secure Payment</span>
                </div>
                <div className="pc-trust-badge">
                  <ZapIcon />
                  <span>Instant Delivery</span>
                </div>
                <div className="pc-trust-badge">
                  <LockIcon />
                  <span>Encrypted</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="pc-payment-methods">
                <span className="pc-pm-label">Accepted Payment Methods</span>
                <div className="pc-pm-icons">
                  <span className="pc-pm-icon">UPI</span>
                  <span className="pc-pm-icon">Cards</span>
                  <span className="pc-pm-icon">Net Banking</span>
                  <span className="pc-pm-icon">Wallets</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pc-checkout-footer">
          <p>© 2026 Daevik. All rights reserved.</p>
          <div className="pc-footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms & Conditions</a>
            <a href="#">Refund Policy</a>
            <a href="mailto:support@daevik.in">Contact</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <>
      <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading checkout...</div>}>
        <CheckoutContent />
      </Suspense>
      <CheckoutStyles />
    </>
  );
}

function CheckoutStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

      /* ====== VARIABLES ====== */
      :root {
        --pc-bg: #F8FAFC;
        --pc-white: #FFFFFF;
        --pc-emerald: #10B981;
        --pc-emerald-hover: #059669;
        --pc-emerald-light: #D1FAE5;
        --pc-blue: #4F46E5;
        --pc-blue-light: #EEF2FF;
        --pc-gold: #F59E0B;
        --pc-text: #0F172A;
        --pc-text-secondary: #334155;
        --pc-text-muted: #64748B;
        --pc-border: #E2E8F0;
        --pc-border-focus: #94A3B8;
        --pc-error: #DC2626;
        --pc-error-bg: #FEF2F2;
        --pc-shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
        --pc-shadow-md: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05);
        --pc-shadow-lg: 0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04);
        --pc-radius: 12px;
        --pc-radius-lg: 16px;
      }

      /* ====== RESET ====== */
      .pc-checkout-page * { box-sizing: border-box; margin: 0; padding: 0; }
      .pc-checkout-page {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background: var(--pc-bg);
        color: var(--pc-text);
        min-height: 100vh;
        -webkit-font-smoothing: antialiased;
      }

      /* ====== SECURITY BAR ====== */
      .pc-security-bar {
        background: var(--pc-text);
        padding: 8px 0;
      }
      .pc-security-bar-inner {
        max-width: 1100px;
        margin: 0 auto;
        padding: 0 24px;
        display: flex;
        justify-content: center;
        gap: 24px;
        flex-wrap: wrap;
      }
      .pc-security-item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #94A3B8;
        font-size: 0.75rem;
        font-weight: 500;
        letter-spacing: 0.02em;
      }
      .pc-security-item svg { color: var(--pc-emerald); }

      /* ====== WRAPPER ====== */
      .pc-checkout-wrapper {
        max-width: 1100px;
        margin: 0 auto;
        padding: 0 24px 60px;
      }

      /* ====== LOGO ====== */
      .pc-checkout-logo {
        padding: 28px 0;
        text-align: center;
      }
      .pc-checkout-logo a {
        text-decoration: none;
      }
      .pc-logo-text {
        font-size: 1.75rem;
        font-weight: 800;
        color: var(--pc-text);
        letter-spacing: -0.03em;
      }
      .pc-logo-accent { color: var(--pc-blue); }

      /* ====== CHECKOUT HEADER ====== */
      .pc-checkout-header {
        padding: 20px 0 28px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        position: relative;
      }
      .pc-back-link {
        position: absolute;
        left: 0;
        top: 24px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--pc-text-muted);
        text-decoration: none;
        transition: all 0.2s ease;
        padding: 6px 12px;
        border-radius: 8px;
      }
      .pc-back-link:hover {
        color: var(--pc-blue);
        background: var(--pc-blue-light);
      }
      .pc-back-link svg { flex-shrink: 0; }
      .pc-breadcrumb {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.8rem;
      }
      .pc-breadcrumb a {
        color: var(--pc-text-muted);
        text-decoration: none;
        font-weight: 500;
        transition: color 0.2s;
      }
      .pc-breadcrumb a:hover { color: var(--pc-blue); }
      .pc-breadcrumb-sep { color: #CBD5E1; }
      .pc-breadcrumb-current {
        color: var(--pc-text);
        font-weight: 600;
      }
      @media (max-width: 860px) {
        .pc-back-link {
          position: static;
          align-self: flex-start;
        }
      }

      /* ====== GRID ====== */
      .pc-checkout-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
        align-items: flex-start;
      }
      @media (max-width: 860px) {
        .pc-checkout-grid {
          grid-template-columns: 1fr;
        }
      }

      /* ====== ORDER SUMMARY (LEFT) ====== */
      .pc-order-summary {
        background: var(--pc-white);
        border-radius: var(--pc-radius-lg);
        border: 1px solid var(--pc-border);
        padding: 32px;
        box-shadow: var(--pc-shadow-md);
      }
      .pc-summary-title {
        font-size: 1.35rem;
        font-weight: 700;
        margin-bottom: 24px;
        color: var(--pc-text);
      }

      /* Product Card */
      .pc-product-card {
        display: flex;
        gap: 20px;
        padding-bottom: 24px;
        border-bottom: 1px solid var(--pc-border);
        margin-bottom: 24px;
      }
      .pc-product-image-wrap {
        width: 100px;
        flex-shrink: 0;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: var(--pc-shadow-md);
        border: 1px solid var(--pc-border);
      }
      .pc-product-image {
        width: 100%;
        height: auto;
        display: block;
      }
      .pc-product-badge {
        display: inline-block;
        background: var(--pc-blue-light);
        color: var(--pc-blue);
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        padding: 3px 8px;
        border-radius: 4px;
        margin-bottom: 8px;
      }
      .pc-product-name {
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--pc-text);
        margin-bottom: 4px;
        line-height: 1.3;
      }
      .pc-product-tagline {
        font-size: 0.85rem;
        color: var(--pc-text-muted);
      }

      /* Included List */
      .pc-included-section {
        margin-bottom: 28px;
      }
      .pc-included-title {
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--pc-text);
        margin-bottom: 16px;
      }
      .pc-included-list {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .pc-included-list li {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        font-size: 0.9rem;
        color: var(--pc-text-secondary);
      }
      .pc-included-list svg {
        color: var(--pc-emerald);
        flex-shrink: 0;
        margin-top: 1px;
      }

      /* Price Breakdown */
      .pc-price-breakdown {
        background: var(--pc-bg);
        border-radius: var(--pc-radius);
        padding: 20px;
        margin-bottom: 24px;
      }
      .pc-price-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.9rem;
        color: var(--pc-text-secondary);
        margin-bottom: 12px;
      }
      .pc-price-struck {
        text-decoration: line-through;
        color: var(--pc-text-muted);
        opacity: 0.8;
      }
      .pc-price-divider {
        height: 1px;
        background: var(--pc-border);
        margin: 16px 0;
      }
      .pc-total-row {
        font-weight: 600;
        color: var(--pc-text);
      }
      .pc-final-row {
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--pc-text);
        margin-bottom: 16px;
      }
      .pc-final-price {
        font-size: 1.5rem;
        color: var(--pc-emerald);
      }
      .pc-savings-badge {
        background: var(--pc-emerald-light);
        color: var(--pc-emerald-hover);
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: 600;
        text-align: center;
        display: block;
      }

      /* Guarantee */
      .pc-guarantee {
        display: flex;
        gap: 16px;
        background: var(--pc-blue-light);
        border-radius: var(--pc-radius);
        padding: 20px;
        border: 1px solid #C7D2FE;
      }
      .pc-guarantee-icon {
        font-size: 1.75rem;
        line-height: 1;
      }
      .pc-guarantee strong {
        display: block;
        font-size: 0.95rem;
        color: var(--pc-blue);
        margin-bottom: 4px;
      }
      .pc-guarantee p {
        font-size: 0.85rem;
        color: #4338CA;
        line-height: 1.5;
      }

      /* ====== PAYMENT FORM (RIGHT) ====== */
      .pc-payment-section {
        position: relative;
      }
      .pc-payment-card {
        background: var(--pc-white);
        border-radius: var(--pc-radius-lg);
        border: 1px solid var(--pc-border);
        padding: 32px;
        box-shadow: var(--pc-shadow-lg);
      }
      .pc-payment-title {
        font-size: 1.35rem;
        font-weight: 700;
        color: var(--pc-text);
        margin-bottom: 4px;
      }
      .pc-payment-subtitle {
        font-size: 0.9rem;
        color: var(--pc-text-muted);
        margin-bottom: 24px;
      }

      /* Form Fields */
      .pc-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .pc-form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .pc-label {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--pc-text);
      }
      .pc-required { color: var(--pc-error); }
      .pc-input {
        width: 100%;
        padding: 14px 16px;
        border: 1px solid var(--pc-border);
        border-radius: 8px;
        font-size: 1rem;
        font-family: inherit;
        transition: all 0.2s;
        background: #FDFDFD;
        color: var(--pc-text);
      }
      .pc-input:focus {
        outline: none;
        border-color: var(--pc-blue);
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        background: var(--pc-white);
      }
      .pc-input::placeholder { color: #94A3B8; }
      .pc-hint {
        font-size: 0.75rem;
        color: var(--pc-text-muted);
      }

      /* Phone Input Overrides */
      .pc-phone-container {
        display: flex;
        align-items: center;
        background: #FDFDFD;
        border: 1px solid var(--pc-border);
        border-radius: 8px;
        padding: 0 16px;
        transition: all 0.2s;
      }
      .pc-phone-container:focus-within {
        border-color: var(--pc-blue);
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        background: var(--pc-white);
      }
      .PhoneInputCountry {
        margin-right: 12px;
      }
      .PhoneInputInput {
        flex: 1;
        min-width: 0;
        border: none;
        padding: 14px 0;
        font-size: 1rem;
        font-family: inherit;
        background: transparent;
        color: var(--pc-text);
      }
      .PhoneInputInput:focus {
        outline: none;
      }

      /* Error Box */
      .pc-error-box {
        background: var(--pc-error-bg);
        border: 1px solid #FCA5A5;
        color: var(--pc-error);
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 0.9rem;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      /* Mobile Price Box */
      .pc-mobile-price-box {
        display: none;
        background: var(--pc-bg);
        border: 1px solid var(--pc-border);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 8px;
      }
      .pc-mobile-price-inner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 700;
        color: var(--pc-text);
      }
      .pc-mobile-price {
        font-size: 1.25rem;
        color: var(--pc-emerald);
      }
      @media (max-width: 860px) {
        .pc-mobile-price-box { display: block; }
      }

      /* Pay Button */
      .pc-pay-btn {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 12px;
        background: var(--pc-blue);
        color: var(--pc-white);
        border: none;
        padding: 16px;
        border-radius: 8px;
        font-size: 1.15rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.39);
        width: 100%;
        margin-top: 8px;
      }
      .pc-pay-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(79, 70, 229, 0.5);
      }
      .pc-pay-btn:disabled {
        background: #94A3B8;
        box-shadow: none;
        cursor: not-allowed;
      }
      .pc-nested-icon {
        display: flex;
        align-items: center;
        background: rgba(255,255,255,0.2);
        padding: 4px;
        border-radius: 4px;
      }
      .pc-btn-loading {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .pc-spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 3px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s ease-in-out infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      
      .pc-pay-note {
        text-align: center;
        font-size: 0.8rem;
        color: var(--pc-text-muted);
      }

      /* Trust Row */
      .pc-trust-row {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 20px;
        margin-top: 28px;
        padding-top: 24px;
        border-top: 1px solid var(--pc-border);
      }
      .pc-trust-badge {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--pc-text-secondary);
      }
      .pc-trust-badge svg {
        color: var(--pc-emerald);
      }

      /* Payment Methods */
      .pc-payment-methods {
        margin-top: 24px;
        text-align: center;
      }
      .pc-pm-label {
        display: block;
        font-size: 0.75rem;
        color: var(--pc-text-muted);
        margin-bottom: 12px;
      }
      .pc-pm-icons {
        display: flex;
        justify-content: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .pc-pm-icon {
        font-size: 0.75rem;
        font-weight: 700;
        color: #475569;
        background: #F1F5F9;
        padding: 4px 10px;
        border-radius: 4px;
        border: 1px solid var(--pc-border);
      }

      /* ====== FOOTER ====== */
      .pc-checkout-footer {
        margin-top: 40px;
        text-align: center;
        border-top: 1px solid var(--pc-border);
        padding-top: 32px;
      }
      .pc-checkout-footer p {
        font-size: 0.85rem;
        color: var(--pc-text-muted);
        margin-bottom: 12px;
      }
      .pc-footer-links {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 16px;
      }
      .pc-footer-links a {
        font-size: 0.85rem;
        color: var(--pc-text-secondary);
        text-decoration: none;
        font-weight: 500;
        transition: color 0.2s;
      }
      .pc-footer-links a:hover {
        color: var(--pc-blue);
      }

      /* Animations */
      @keyframes slideRight {
        from { opacity: 0; transform: translateX(-20px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes slideLeft {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
      }
      .animate-slide-right { animation: slideRight 0.5s ease forwards; }
      .animate-slide-left { animation: slideLeft 0.5s ease forwards; animation-delay: 0.1s; opacity: 0; }
      @media (max-width: 860px) {
        .animate-slide-right, .animate-slide-left {
          animation: slideRight 0.5s ease forwards;
        }
      }
    `}} />
  );
}
