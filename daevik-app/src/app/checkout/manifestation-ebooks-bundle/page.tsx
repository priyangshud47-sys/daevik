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
  const slug = 'manifestation-ebooks-bundle';

  // Hardcoded product info — this is a dedicated checkout page, no need to fetch from admin API
  const product = {
    id: 'manifestation-ebooks-bundle',
    name: '5 Powerful Manifestation Ebooks Bundle',
    slug: 'manifestation-ebooks-bundle',
    price: 149,
    description: 'Rewire your subconscious mind, attract abundance, and manifest your dream life with these 5 powerful guides.',
    thumbnail_url: '/product-images/manifestation-ebooks-bundle.jpg',
    gateway_provider: 'cashfree',
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

  // Load saved data from localStorage, URL params, and secure server-side session on initial load
  useEffect(() => {
    // 1. Instantly load from URL Parameters
    const urlName = searchParams.get('name') || searchParams.get('first_name');
    const urlEmail = searchParams.get('email');
    const urlPhone = searchParams.get('phone') || searchParams.get('tel');

    // 2. Load from client's browser storage
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

    // 3. Attempt to fetch from server if they are a returning customer
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

  // Track checkout_start funnel event and CAPI InitiateCheckout
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

    // Facebook CAPI InitiateCheckout (initial — fires on page load with session ID only)
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
      }),
    }).catch(() => {});

    // Facebook Client-Side Pixel
    trackFbEvent('InitiateCheckout', {
      value: product.price,
      currency: 'INR',
      content_name: product.name,
      content_ids: [product.id],
      content_type: 'product',
    }, { eventID: checkoutEventId.current });
  }, []);

  // Check for payment error from redirect
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
      // This gives Facebook email, phone, name for 15.68% better match quality
      const sessionId = sessionStorage.getItem('daevik_session') || '';
      const nameParts = formData.name.trim().split(' ');
      const userFirstName = nameParts[0] || '';
      const userLastName = nameParts.slice(1).join(' ') || '';
      fetch('/api/track/capi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'InitiateCheckout',
          eventId: `${checkoutEventId.current}_enriched`,
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

  const handleCashfreeCheckout = async (data: {
    paymentSessionId: string;
    mode: string;
    orderId: string;
  }) => {
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = async () => {
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
            window.location.href = `/thank-you/${slug}?orderId=${data.orderId}`;
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
    script.onerror = () => {
      setError('Failed to load Cashfree SDK');
      setSubmitting(false);
    };
  };

  const handleRazorpayCheckout = async (data: {
    razorpayOrderId: string;
    razorpayKeyId: string;
    amount: number;
    currency: string;
    productName: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    orderId: string;
  }) => {
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
        theme: { color: '#D4AF37' },
        handler: function () {
          window.location.href = `/thank-you/${slug}?orderId=${data.orderId}`;
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
          },
        },
      };

      const rzp = new (window as unknown as { Razorpay: new (opts: typeof options) => { open: () => void } }).Razorpay(options);
      rzp.open();
    };
  };

  const handlePayUCheckout = (data: { formData: Record<string, string> }) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = data.formData.action;

    Object.entries(data.formData).forEach(([key, value]) => {
      if (key !== 'action') {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      }
    });

    document.body.appendChild(form);
    form.submit();
  };

  return (
    <>
      <div className="zig-checkout-page">
        {/* Top Security Bar */}
        <div className="zig-security-bar">
          <div className="zig-security-bar-inner">
            <span className="zig-security-item"><LockIcon /> 256-bit SSL Encrypted</span>
            <span className="zig-security-item"><ShieldIcon /> Secure Checkout</span>
            <span className="zig-security-item"><ZapIcon /> Instant Delivery</span>
          </div>
        </div>

        <div className="zig-checkout-wrapper">
          {/* Header with Logo + Back Link */}
          <div className="zig-checkout-header">
            <Link href={`/product/${slug}`} className="zig-back-link">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
              Back to Product Page
            </Link>
            <div className="zig-checkout-logo">
              <Link href={`/product/${slug}`}>
                <span className="zig-logo-text">Dae<span className="zig-logo-accent">vik</span></span>
              </Link>
            </div>
            <div className="zig-breadcrumb">
              <Link href={`/product/${slug}`}>Manifestation Ebooks</Link>
              <span className="zig-breadcrumb-sep">›</span>
              <span className="zig-breadcrumb-current">Checkout</span>
            </div>
          </div>

          <div className="zig-checkout-grid">
            {/* LEFT: Order Summary */}
            <div className="zig-order-summary animate-slide-right">
              <h2 className="zig-summary-title">Order Summary</h2>

              {/* Product Card */}
              <div className="zig-product-card">
                <div className="zig-product-image-wrap">
                  <img
                    src={product.thumbnail_url}
                    alt={product.name}
                    className="zig-product-image"
                  />
                </div>
                <div className="zig-product-details">
                  <span className="zig-product-badge">DIGITAL BUNDLE</span>
                  <h3 className="zig-product-name">{product.name}</h3>
                  <p className="zig-product-tagline">5 Premium PDF Guides</p>
                </div>
              </div>

              {/* What's Included */}
              <div className="zig-included-section">
                <h4 className="zig-included-title">What&apos;s Included</h4>
                <ul className="zig-included-list">
                  <li><CheckCircle /> <span>Power of Visualization</span></li>
                  <li><CheckCircle /> <span>Attraction Mantra Secrets</span></li>
                  <li><CheckCircle /> <span>365 Manifestation Power</span></li>
                  <li><CheckCircle /> <span>Mastering Manifestation</span></li>
                  <li><CheckCircle /> <span>Manifesting Maestro</span></li>
                </ul>
              </div>

              {/* Price Breakdown */}
              <div className="zig-price-breakdown">
                <div className="zig-price-row">
                  <span>Power of Visualization</span>
                  <span className="zig-price-struck">₹1999</span>
                </div>
                <div className="zig-price-row">
                  <span>Attraction Mantra Secrets</span>
                  <span className="zig-price-struck">₹1999</span>
                </div>
                <div className="zig-price-row">
                  <span>365 Manifestation Power</span>
                  <span className="zig-price-struck">₹1999</span>
                </div>
                <div className="zig-price-row">
                  <span>Mastering Manifestation</span>
                  <span className="zig-price-struck">₹1999</span>
                </div>
                <div className="zig-price-row">
                  <span>Manifesting Maestro</span>
                  <span className="zig-price-struck">₹2003</span>
                </div>
                <div className="zig-price-divider" />
                <div className="zig-price-row zig-total-row">
                  <span>Total Value</span>
                  <span className="zig-price-struck">₹9999</span>
                </div>
                <div className="zig-price-row zig-final-row">
                  <span>You Pay Today</span>
                  <span className="zig-final-price">₹149</span>
                </div>
                <div className="zig-savings-badge">🎉 You save ₹9850 (98% off)</div>
              </div>

              {/* Guarantee */}
              <div className="zig-guarantee">
                <div className="zig-guarantee-icon">🛡️</div>
                <div>
                  <strong>Secure Checkout</strong>
                  <p>One-time payment of ₹149. No subscriptions. No hidden charges. Instant access after payment.</p>
                </div>
              </div>
            </div>

            {/* RIGHT: Payment Form */}
            <div className="zig-payment-section animate-slide-left">
              <div className="zig-payment-card">
                <h2 className="zig-payment-title">Complete Your Purchase</h2>
                <p className="zig-payment-subtitle">Fill in your details to get instant access</p>

                {/* Error */}
                {error && (
                  <div className="zig-error-box">
                    ⚠️ {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="zig-form">
                  <div className="zig-form-group">
                    <label htmlFor="zig-name" className="zig-label">Full Name <span className="zig-required">*</span></label>
                    <input
                      id="zig-name"
                      type="text"
                      className="zig-input"
                      placeholder="Enter your full name"
                      autoComplete="name"
                      name="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>

                  <div className="zig-form-group">
                    <label htmlFor="zig-email" className="zig-label">Email Address <span className="zig-required">*</span></label>
                    <input
                      id="zig-email"
                      type="email"
                      className="zig-input"
                      placeholder="your@email.com"
                      autoComplete="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                    <span className="zig-hint">📩 Your bundle will be delivered to this email</span>
                  </div>

                  <div className="zig-form-group">
                    <label htmlFor="zig-phone" className="zig-label">Phone Number <span className="zig-required">*</span></label>
                    {country && (
                      <PhoneInput
                        key={country}
                        id="zig-phone"
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
                        className="zig-phone-container"
                      />
                    )}
                  </div>

                  {/* Mobile Price Summary */}
                  <div className="zig-mobile-price-box">
                    <div className="zig-mobile-price-inner">
                      <span>Total</span>
                      <span className="zig-mobile-price">₹149</span>
                    </div>
                  </div>

                  <button type="submit" className="zig-pay-btn" disabled={submitting}>
                    {submitting ? (
                      <span className="zig-btn-loading">
                        <span className="zig-spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }}></span>
                        Initializing...
                      </span>
                    ) : (
                      <>
                        <span>Complete Purchase</span>
                        <span className="zig-nested-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </span>
                      </>
                    )}
                  </button>

                  <p className="zig-pay-note">
                    Instant access after payment. No subscription.
                  </p>
                </form>

                {/* Trust Badges */}
                <div className="zig-trust-row">
                  <div className="zig-trust-badge">
                    <ShieldIcon />
                    <span>Secure Payment</span>
                  </div>
                  <div className="zig-trust-badge">
                    <ZapIcon />
                    <span>Instant Delivery</span>
                  </div>
                  <div className="zig-trust-badge">
                    <LockIcon />
                    <span>Encrypted</span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="zig-payment-methods">
                  <span className="zig-pm-label">Accepted Payment Methods</span>
                  <div className="zig-pm-icons">
                    <span className="zig-pm-icon">UPI</span>
                    <span className="zig-pm-icon">Cards</span>
                    <span className="zig-pm-icon">Net Banking</span>
                    <span className="zig-pm-icon">Wallets</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="zig-checkout-footer">
            <p>© 2026 Daevik. All rights reserved.</p>
            <div className="zig-footer-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms & Conditions</a>
              <a href="#">Refund Policy</a>
              <a href="mailto:support@daevik.in">Contact</a>
            </div>
          </div>
        </div>
      </div>
      <CheckoutStyles />
    </>
  );
}

function CheckoutStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

      /* ====== VARIABLES ====== */
      :root {
        --zig-bg: #F4F1FA;
        --zig-white: #FFFFFF;
        --zig-emerald: #D4AF37; /* Replaced with Gold for this theme */
        --zig-emerald-hover: #C5A028;
        --zig-emerald-light: #FDF9E7;
        --zig-gold: #D4AF37;
        --zig-gold-light: #FDF9E7;
        --zig-blue: #4A148C;
        --zig-blue-light: #F3E8FF;
        --zig-text: #2D1B4E;
        --zig-text-secondary: #4B3C6A;
        --zig-text-muted: #6B5B95;
        --zig-border: #D1C4E9;
        --zig-border-focus: #9C88C0;
        --zig-error: #DC2626;
        --zig-error-bg: #FEF2F2;
        --zig-shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
        --zig-shadow-md: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05);
        --zig-shadow-lg: 0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04);
        --zig-shadow-xl: 0 20px 40px -12px rgba(0,0,0,0.12);
        --zig-radius: 12px;
        --zig-radius-lg: 16px;
      }

      /* ====== RESET ====== */
      .zig-checkout-page * { box-sizing: border-box; margin: 0; padding: 0; }
      .zig-checkout-page {
        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
        background: var(--zig-bg);
        color: var(--zig-text);
        min-height: 100vh;
        -webkit-font-smoothing: antialiased;
      }

      /* ====== SECURITY BAR ====== */
      .zig-security-bar {
        background: #2D1B4E;
        padding: 8px 0;
      }
      .zig-security-bar-inner {
        max-width: 1100px;
        margin: 0 auto;
        padding: 0 24px;
        display: flex;
        justify-content: center;
        gap: 24px;
        flex-wrap: wrap;
      }
      .zig-security-item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #D1C4E9;
        font-size: 0.75rem;
        font-weight: 500;
        letter-spacing: 0.02em;
      }
      .zig-security-item svg { color: var(--zig-gold); }

      /* ====== WRAPPER ====== */
      .zig-checkout-wrapper {
        max-width: 1100px;
        margin: 0 auto;
        padding: 0 24px 60px;
      }

      /* ====== LOGO ====== */
      .zig-checkout-logo {
        padding: 28px 0;
        text-align: center;
      }
      .zig-checkout-logo a {
        text-decoration: none;
      }
      .zig-logo-text {
        font-size: 1.75rem;
        font-weight: 800;
        color: var(--zig-text);
        letter-spacing: -0.03em;
      }
      .zig-logo-accent { color: var(--zig-gold); }

      /* ====== CHECKOUT HEADER ====== */
      .zig-checkout-header {
        padding: 20px 0 28px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        position: relative;
      }
      .zig-back-link {
        position: absolute;
        left: 0;
        top: 24px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--zig-text-muted);
        text-decoration: none;
        transition: all 0.2s ease;
        padding: 6px 12px;
        border-radius: 8px;
      }
      .zig-back-link:hover {
        color: var(--zig-gold);
        background: var(--zig-gold-light);
      }
      .zig-back-link svg { flex-shrink: 0; }
      .zig-breadcrumb {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.8rem;
      }
      .zig-breadcrumb a {
        color: var(--zig-text-muted);
        text-decoration: none;
        font-weight: 500;
        transition: color 0.2s;
      }
      .zig-breadcrumb a:hover { color: var(--zig-blue); }
      .zig-breadcrumb-sep { color: #D1C4E9; }
      .zig-breadcrumb-current {
        color: var(--zig-text);
        font-weight: 600;
      }
      @media (max-width: 860px) {
        .zig-back-link {
          position: static;
          align-self: flex-start;
        }
      }

      /* ====== GRID ====== */
      .zig-checkout-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
        align-items: flex-start;
      }
      @media (max-width: 860px) {
        .zig-checkout-grid {
          grid-template-columns: 1fr;
        }
      }

      /* ====== ORDER SUMMARY (LEFT) ====== */
      .zig-order-summary {
        background: var(--zig-white);
        border-radius: var(--zig-radius-lg);
        border: 1px solid var(--zig-border);
        padding: 32px;
        box-shadow: var(--zig-shadow-md);
      }
      .zig-summary-title {
        font-size: 1.35rem;
        font-weight: 700;
        margin-bottom: 24px;
        color: var(--zig-text);
      }

      /* Product Card */
      .zig-product-card {
        display: flex;
        gap: 20px;
        padding-bottom: 24px;
        border-bottom: 1px solid var(--zig-border);
        margin-bottom: 24px;
      }
      .zig-product-image-wrap {
        width: 100px;
        flex-shrink: 0;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: var(--zig-shadow-md);
        border: 1px solid var(--zig-border);
      }
      .zig-product-image {
        width: 100%;
        height: auto;
        display: block;
      }
      .zig-product-badge {
        display: inline-block;
        background: var(--zig-blue-light);
        color: var(--zig-blue);
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        padding: 3px 8px;
        border-radius: 4px;
        margin-bottom: 8px;
      }
      .zig-product-name {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--zig-text);
        margin-bottom: 4px;
        line-height: 1.3;
      }
      .zig-product-tagline {
        font-size: 0.85rem;
        color: var(--zig-text-muted);
        font-weight: 500;
      }

      /* Included */
      .zig-included-section {
        margin-bottom: 24px;
      }
      .zig-included-title {
        font-size: 0.8rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        color: var(--zig-text-muted);
        text-transform: uppercase;
        margin-bottom: 14px;
      }
      .zig-included-list {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .zig-included-list li {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--zig-text-secondary);
      }
      .zig-included-list svg {
        color: var(--zig-emerald);
        flex-shrink: 0;
      }

      /* Price Breakdown */
      .zig-price-breakdown {
        background: var(--zig-bg);
        border-radius: var(--zig-radius);
        padding: 20px;
        margin-bottom: 24px;
        border: 1px solid var(--zig-border);
      }
      .zig-price-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
        font-size: 0.9rem;
        color: var(--zig-text-secondary);
      }
      .zig-price-struck {
        text-decoration: line-through;
        color: var(--zig-text-muted);
      }
      .zig-price-divider {
        height: 1px;
        background: var(--zig-border);
        margin: 10px 0;
      }
      .zig-total-row {
        font-weight: 600;
        color: var(--zig-text);
      }
      .zig-final-row {
        font-weight: 700;
        font-size: 1.1rem;
        color: var(--zig-text);
        padding-top: 10px;
      }
      .zig-final-price {
        color: var(--zig-emerald);
        font-size: 1.5rem;
        font-weight: 800;
      }
      .zig-savings-badge {
        background: var(--zig-emerald-light);
        color: var(--zig-emerald);
        font-size: 0.8rem;
        font-weight: 700;
        text-align: center;
        padding: 8px;
        border-radius: 8px;
        margin-top: 12px;
        border: 1px solid var(--zig-gold);
      }

      /* Guarantee */
      .zig-guarantee {
        display: flex;
        gap: 14px;
        align-items: flex-start;
        background: var(--zig-gold-light);
        border: 1px solid #F5E6B8;
        border-radius: var(--zig-radius);
        padding: 16px;
      }
      .zig-guarantee-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
        line-height: 1;
      }
      .zig-guarantee strong {
        font-size: 0.9rem;
        display: block;
        margin-bottom: 4px;
        color: var(--zig-text);
      }
      .zig-guarantee p {
        font-size: 0.8rem;
        color: var(--zig-text-muted);
        line-height: 1.5;
      }

      /* ====== PAYMENT SECTION (RIGHT) ====== */
      .zig-payment-section { }
      .zig-payment-card {
        background: var(--zig-white);
        border-radius: var(--zig-radius-lg);
        border: 1px solid var(--zig-border);
        padding: 32px;
        box-shadow: var(--zig-shadow-lg);
        position: sticky;
        top: 24px;
      }
      .zig-payment-title {
        font-size: 1.35rem;
        font-weight: 700;
        margin-bottom: 4px;
        color: var(--zig-text);
      }
      .zig-payment-subtitle {
        font-size: 0.9rem;
        color: var(--zig-text-muted);
        margin-bottom: 24px;
        font-weight: 500;
      }

      /* Error */
      .zig-error-box {
        background: var(--zig-error-bg);
        color: var(--zig-error);
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 600;
        margin-bottom: 20px;
        border: 1px solid #FECACA;
      }

      /* Form */
      .zig-form {
        display: flex;
        flex-direction: column;
        gap: 18px;
      }
      .zig-form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .zig-label {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--zig-text);
      }
      .zig-required { color: var(--zig-error); }
      .zig-optional { color: var(--zig-text-muted); font-weight: 400; font-size: 0.8rem; }

      .zig-input {
        width: 100%;
        padding: 12px 14px;
        font-size: 0.95rem;
        font-family: 'Outfit', sans-serif;
        border: 1.5px solid var(--zig-border);
        border-radius: 10px;
        background: var(--zig-white);
        color: var(--zig-text);
        outline: none;
        transition: all 0.2s ease;
      }
      .zig-input::placeholder {
        color: #9C88C0;
      }
      .zig-input:focus {
        border-color: var(--zig-blue);
        box-shadow: 0 0 0 3px rgba(74, 20, 140, 0.1);
      }

      .zig-phone-container {
        display: flex;
        align-items: center;
        width: 100%;
        border: 1.5px solid var(--zig-border);
        border-radius: 10px;
        background: var(--zig-white);
        transition: all 0.2s ease;
      }
      .zig-phone-container:focus-within {
        border-color: var(--zig-blue);
        box-shadow: 0 0 0 3px rgba(74, 20, 140, 0.1);
      }
      .zig-phone-container .PhoneInputCountry {
        display: flex;
        align-items: center;
        padding-left: 14px;
        padding-right: 10px;
        border-right: 1px solid var(--zig-border);
        margin-right: 10px;
      }
      .zig-phone-container .PhoneInputInput {
        flex: 1;
        min-width: 0;
        border: none;
        background: transparent;
        padding: 12px 14px 12px 0;
        font-size: 0.95rem;
        font-family: 'Outfit', sans-serif;
        color: var(--zig-text);
        outline: none;
      }
      .zig-phone-container .PhoneInputInput::placeholder {
        color: #9C88C0;
      }
      .zig-hint {
        font-size: 0.75rem;
        color: var(--zig-text-muted);
        font-weight: 500;
      }

      /* Mobile Price Box */
      .zig-mobile-price-box {
        display: none;
      }
      @media (max-width: 860px) {
        .zig-mobile-price-box {
          display: block;
        }
      }
      .zig-mobile-price-inner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--zig-bg);
        padding: 14px 16px;
        border-radius: 10px;
        border: 1px solid var(--zig-border);
        font-weight: 600;
      }
      .zig-mobile-price {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--zig-emerald);
      }

      /* Pay Button (High-End Aesthetic) */
      .zig-pay-btn {
        width: 100%;
        padding: 16px 24px;
        font-size: 1.05rem;
        font-weight: 800;
        font-family: 'Outfit', sans-serif;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: #111;
        background: linear-gradient(135deg, #FFD700 0%, #D4AF37 100%);
        border: none;
        border-radius: 9999px; /* Pill shape */
        cursor: pointer;
        transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background 250ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 250ms cubic-bezier(0.23, 1, 0.32, 1);
        box-shadow: 0 4px 14px rgba(212, 175, 55, 0.4);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .zig-pay-btn:hover:not(:disabled) {
        box-shadow: 0 6px 20px rgba(212, 175, 55, 0.6);
        transform: translateY(-2px);
      }
      .zig-pay-btn:active:not(:disabled) {
        transform: scale(0.97); /* Physical squish */
      }
      .zig-pay-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
      .zig-nested-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 9999px;
        background: rgba(0, 0, 0, 0.1);
        margin-left: 8px;
        margin-right: -12px;
        transition: transform 250ms cubic-bezier(0.23, 1, 0.32, 1);
      }
      .zig-pay-btn:hover .zig-nested-icon {
        transform: translate(2px, -1px) scale(1.05); /* Internal kinetic tension */
      }

      @keyframes zig-pulse {
        0% { box-shadow: 0 4px 14px rgba(212, 175, 55, 0.4); }
        50% { box-shadow: 0 4px 14px rgba(212, 175, 55, 0.4), 0 0 0 8px rgba(212, 175, 55, 0); }
        100% { box-shadow: 0 4px 14px rgba(212, 175, 55, 0.4); }
      }

      .zig-btn-loading {
        display: inline-flex;
        align-items: center;
        gap: 10px;
      }
      .zig-pay-note {
        text-align: center;
        font-size: 0.75rem;
        color: var(--zig-text-muted);
        font-weight: 500;
      }

      /* Trust Badges */
      .zig-trust-row {
        display: flex;
        justify-content: center;
        gap: 16px;
        flex-wrap: wrap;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid var(--zig-border);
      }
      .zig-trust-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--zig-text-muted);
      }
      .zig-trust-badge svg { color: var(--zig-emerald); }

      /* Payment Methods */
      .zig-payment-methods {
        margin-top: 20px;
        text-align: center;
      }
      .zig-pm-label {
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--zig-text-muted);
        letter-spacing: 0.03em;
        text-transform: uppercase;
        display: block;
        margin-bottom: 10px;
      }
      .zig-pm-icons {
        display: flex;
        justify-content: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .zig-pm-icon {
        background: var(--zig-bg);
        border: 1px solid var(--zig-border);
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--zig-text-secondary);
        letter-spacing: 0.02em;
      }

      /* ====== FOOTER ====== */
      .zig-checkout-footer {
        text-align: center;
        margin-top: 48px;
        padding-top: 24px;
        border-top: 1px solid var(--zig-border);
      }
      .zig-checkout-footer p {
        font-size: 0.8rem;
        color: var(--zig-text-muted);
        margin-bottom: 12px;
      }
      .zig-footer-links {
        display: flex;
        justify-content: center;
        gap: 20px;
        flex-wrap: wrap;
      }
      .zig-footer-links a {
        font-size: 0.8rem;
        color: var(--zig-text-muted);
        text-decoration: none;
        transition: color 0.2s;
      }
      .zig-footer-links a:hover {
        color: var(--zig-blue);
      }

      /* ====== SPINNERS ====== */
      .zig-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--zig-border);
        border-top-color: var(--zig-emerald);
        border-radius: 50%;
        animation: zig-spin 0.8s linear infinite;
      }
      .zig-spinner-small {
        display: inline-block;
        width: 18px;
        height: 18px;
        border: 2.5px solid rgba(0,0,0,0.2);
        border-top-color: #111;
        border-radius: 50%;
        animation: zig-spin 0.7s linear infinite;
      }
      @keyframes zig-spin { to { transform: rotate(360deg); } }

      /* ====== BACK BUTTON ====== */
      .zig-btn-back {
        display: inline-block;
        padding: 12px 24px;
        background: var(--zig-white);
        color: var(--zig-text);
        border: 1px solid var(--zig-border);
        border-radius: 10px;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.2s;
      }
      .zig-btn-back:hover {
        border-color: var(--zig-text-muted);
        box-shadow: var(--zig-shadow-sm);
      }

      /* ====== ANIMATIONS ====== */
      @keyframes slideRight {
        from { opacity: 0; transform: translateX(-20px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes slideLeft {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
      }
      .animate-slide-right { animation: slideRight 0.6s ease forwards; }
      .animate-slide-left { animation: slideLeft 0.6s ease forwards; animation-delay: 0.15s; opacity: 0; }

      /* ====== MOBILE ====== */
      @media (max-width: 860px) {
        .zig-checkout-grid {
          gap: 24px;
        }
        .zig-order-summary {
          padding: 24px;
        }
        .zig-payment-card {
          padding: 24px;
          position: static;
        }
        .zig-product-card {
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .zig-product-image-wrap {
          width: 120px;
        }
        .animate-slide-right,
        .animate-slide-left {
          animation: none;
          opacity: 1;
        }
      }

      @media (max-width: 480px) {
        .zig-checkout-wrapper {
          padding: 0 16px 48px;
        }
        .zig-order-summary,
        .zig-payment-card {
          padding: 20px;
          border-radius: var(--zig-radius);
        }
        .zig-payment-title {
          font-size: 1.15rem;
        }
        .zig-summary-title {
          font-size: 1.15rem;
        }
        .zig-security-bar-inner {
          gap: 12px;
        }
        .zig-security-item {
          font-size: 0.65rem;
        }
      }
    `}} />
  );
}

export default function ManifestationEbooksCheckout() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="zig-spinner"></div></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
