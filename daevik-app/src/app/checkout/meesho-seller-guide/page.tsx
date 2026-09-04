'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackFbEvent } from '@/lib/fb-client';
import { trackGoogleBeginCheckout, setGoogleUserData } from '@/lib/google-client';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const CheckCircle = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
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
  const slug = 'meesho-seller-guide';

  const product = {
    id: 'meesho-seller-guide',
    name: 'Start Selling on Meesho - Business Guide (Latest Sept 2026)',
    slug: 'meesho-seller-guide',
    price: 199,
    description: '15-chapter fact-checked handbook on Meesho selling: No-GST enrolment ID guide, real fee calculations, pricing math for returns & suspension protection.',
    thumbnail_url: '/product-images/meesho-seller-guide.jpg',
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

    // Funnel event
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        sessionId,
        eventType: 'checkout_start',
      }),
    }).catch(() => {});

    // Meta Pixel InitiateCheckout
    trackFbEvent('InitiateCheckout', {
      value: product.price,
      currency: 'INR',
      content_name: product.name,
      content_ids: [product.id],
      content_type: 'product',
      num_items: 1,
      contents: [{ id: product.id, quantity: 1, item_price: product.price }],
    }, { eventID: checkoutEventId.current });

    // Google begin_checkout
    trackGoogleBeginCheckout({
      id: product.id,
      name: product.name,
      price: product.price,
      currency: 'INR',
    });
  }, [product.id, product.name, product.price]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentError = params.get('error');
    if (paymentError) {
      setError('Payment could not be completed. Please try again or use another payment method.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!formData.phone || !isValidPhoneNumber(formData.phone)) {
      setError('Please enter a valid 10-digit mobile number.');
      setSubmitting(false);
      return;
    }

    try {
      const getCookie = (name: string) => {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : undefined;
      };
      const fbp = getCookie('_fbp');
      const fbc = getCookie('_fbc') || (typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('fbclid') ? `fb.1.${Date.now()}.${new URLSearchParams(window.location.search).get('fbclid')}` : undefined) : undefined);
      const gaClientId = getCookie('_ga') || undefined;

      const sessionId = sessionStorage.getItem('daevik_session') || '';
      const nameParts = formData.name.trim().split(' ');
      const userFirstName = nameParts[0] || '';
      const userLastName = nameParts.slice(1).join(' ') || '';

      // Server CAPI InitiateCheckout
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

      // Google Ads Enhanced Conversions
      setGoogleUserData({
        email: formData.email,
        phone_number: formData.phone,
        first_name: userFirstName || undefined,
        last_name: userLastName || undefined,
        country: country || 'IN',
      });

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
          ga_client_id: gaClientId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      switch (data.gateway) {
        case 'cashfree':
          await handleCashfreeCheckout(data);
          break;
        case 'razorpay':
          await handleRazorpayCheckout(data);
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
            setError(result.error.message || 'Payment was cancelled or failed.');
            setSubmitting(false);
          }
          if (result && result.paymentDetails) {
            window.location.href = `/thank-you/${slug}?orderId=${data.orderId}`;
          }
        });
      } catch (e) {
        console.error('Cashfree SDK error:', e);
        setError('Could not open payment window. Please refresh and try again.');
        setSubmitting(false);
      }
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
        theme: { color: '#F43397' },
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

  return (
    <div className="co-page">
      <header className="co-nav">
        <div className="co-nav-inner">
          <Link href={`/product/${slug}`} className="co-back-link">
            &larr; Back to Guide Overview
          </Link>
          <div className="co-secure-pill">
            <LockIcon />
            <span>256-Bit Encrypted Checkout</span>
          </div>
        </div>
      </header>

      <main className="co-main">
        <div className="co-grid">
          {/* Left Column: Form */}
          <div className="co-form-card">
            <div className="co-form-head">
              <h2>Complete Your Order</h2>
              <p>Enter your details below. Your download link will be delivered immediately to this email.</p>
            </div>

            {error && (
              <div className="co-error-box">
                <span className="co-error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="co-form">
              <div className="co-field">
                <label htmlFor="name">Full Name *</label>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                />
              </div>

              <div className="co-field">
                <label htmlFor="email">Email Address (For Instant Delivery) *</label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="ramesh@gmail.com"
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                />
                <span className="co-field-hint">PDF guide and bonus spreadsheets will be sent to this email.</span>
              </div>

              <div className="co-field">
                <label htmlFor="phone">WhatsApp Mobile Number *</label>
                <PhoneInput
                  international
                  defaultCountry={country}
                  value={formData.phone}
                  onChange={(val: any) => handleInputChange('phone', val || '')}
                  className="co-phone-input"
                />
                <span className="co-field-hint">Used for order receipts and download recovery support.</span>
              </div>

              <button type="submit" disabled={submitting} className="co-pay-btn">
                {submitting ? 'Connecting Secure Gateway...' : `PAY ₹${product.price} & GET INSTANT ACCESS →`}
              </button>

              <div className="co-trust-strip">
                <div className="co-trust-item"><ShieldIcon /> 7-Day Guarantee</div>
                <div className="co-trust-item"><LockIcon /> PCI Compliant</div>
                <div className="co-trust-item"><ZapIcon /> Instant Download</div>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary */}
          <div className="co-summary-card">
            <div className="co-prod-preview">
              <div className="co-prod-img-wrap">
                <Image
                  src={product.thumbnail_url}
                  alt={product.name}
                  width={90}
                  height={130}
                  className="co-prod-thumb"
                />
              </div>
              <div className="co-prod-meta">
                <span className="co-tag">SEPT 2026 EDITION</span>
                <h3>Start Selling on Meesho</h3>
                <p>15-Chapter Business Handbook + 4 Launch Bonuses</p>
                <div className="co-prod-price">₹{product.price} <span className="co-prod-strike">₹1,499</span></div>
              </div>
            </div>

            <div className="co-summary-divider"></div>

            <div className="co-summary-lines">
              <div className="co-summary-line">
                <span>15-Chapter Meesho Handbook (PDF)</span>
                <span>₹999</span>
              </div>
              <div className="co-summary-line">
                <span>No-GST Enrolment ID Walkthrough</span>
                <span>₹499</span>
              </div>
              <div className="co-summary-line">
                <span>Wrong-Return Claim Video Script</span>
                <span>₹499</span>
              </div>
              <div className="co-summary-line">
                <span>Indian Wholesale Sourcing Directory</span>
                <span>₹599</span>
              </div>
              <div className="co-summary-line">
                <span>Profit & Return Buffer Spreadsheet</span>
                <span>₹403</span>
              </div>
              <div className="co-summary-divider"></div>
              <div className="co-summary-line co-strike-line">
                <span>Regular Price</span>
                <span style={{ textDecoration: 'line-through' }}>₹2,999</span>
              </div>
              <div className="co-summary-line co-discount-line">
                <span>Special Launch Discount (93% Off)</span>
                <span>-₹2,800</span>
              </div>
              <div className="co-summary-divider"></div>
              <div className="co-summary-line co-total-line">
                <span>Total Amount Due</span>
                <span className="co-total-val">₹{product.price}</span>
              </div>
            </div>

            <div className="co-feature-bullets">
              <div className="co-bullet"><CheckCircle /> <span>Lifetime access to updated 2026 handbook</span></div>
              <div className="co-bullet"><CheckCircle /> <span>No-GST intra-state legal selling guide</span></div>
              <div className="co-bullet"><CheckCircle /> <span>7-day 100% money-back guarantee</span></div>
              <div className="co-bullet"><CheckCircle /> <span>Delivered to email within 10 seconds</span></div>
            </div>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --co-bg: #0D021A;
          --co-card: #18052E;
          --co-border: #35115B;
          --co-pink: #F43397;
          --co-text: #FFFFFF;
          --co-text-sec: #D1C4E9;
          --co-text-mut: #9480AB;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--co-bg); color: var(--co-text); font-family: 'Inter', system-ui, sans-serif; }

        .co-page { min-height: 100vh; display: flex; flex-direction: column; }

        .co-nav {
          background: #120224;
          border-bottom: 1px solid var(--co-border);
          padding: 16px 24px;
        }
        .co-nav-inner {
          max-width: 1080px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .co-back-link {
          color: var(--co-text-sec);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 600;
          transition: color 0.2s;
        }
        .co-back-link:hover { color: var(--co-pink); }
        .co-secure-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: #10B981;
          font-weight: 700;
        }

        .co-main {
          flex: 1;
          padding: 40px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .co-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.9fr;
          gap: 32px;
          max-width: 1040px;
          width: 100%;
        }

        .co-form-card, .co-summary-card {
          background: var(--co-card);
          border: 1px solid var(--co-border);
          border-radius: 20px;
          padding: 36px 32px;
        }

        .co-form-head h2 { font-size: 1.8rem; font-weight: 800; margin-bottom: 8px; }
        .co-form-head p { color: var(--co-text-sec); font-size: 0.95rem; margin-bottom: 24px; }

        .co-error-box {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid #EF4444;
          color: #FCA5A5;
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .co-field { margin-bottom: 20px; }
        .co-field label {
          display: block;
          font-size: 0.9rem;
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--co-text);
        }
        .co-field input {
          width: 100%;
          background: #0E021F;
          border: 1px solid var(--co-border);
          border-radius: 10px;
          padding: 14px 16px;
          color: #FFF;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .co-field input:focus { border-color: var(--co-pink); }
        .co-field-hint { display: block; font-size: 0.75rem; color: var(--co-text-mut); margin-top: 6px; }

        .co-phone-input {
          display: flex;
          align-items: center;
          background: #0E021F;
          border: 1px solid var(--co-border);
          border-radius: 10px;
          padding: 4px 12px;
        }
        .co-phone-input input {
          border: none !important;
          background: transparent !important;
          padding: 10px 8px !important;
        }
        .co-phone-input input:focus { border: none !important; }

        .co-pay-btn {
          width: 100%;
          background: linear-gradient(135deg, #F43397, #D91074);
          color: #FFF;
          border: none;
          padding: 18px;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(244, 51, 151, 0.45);
          transition: all 0.2s;
          margin-top: 10px;
        }
        .co-pay-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(244, 51, 151, 0.65);
        }
        .co-pay-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .co-trust-strip {
          display: flex;
          justify-content: space-between;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--co-border);
        }
        .co-trust-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: var(--co-text-mut);
        }
        .co-trust-item svg { color: #10B981; }

        /* Summary Right */
        .co-prod-preview { display: flex; gap: 16px; align-items: center; margin-bottom: 24px; }
        .co-prod-img-wrap {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--co-border);
          flex-shrink: 0;
        }
        .co-prod-thumb { display: block; object-fit: cover; }
        .co-tag {
          display: inline-block;
          background: rgba(244, 51, 151, 0.2);
          color: #FF70B8;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 4px;
          margin-bottom: 4px;
        }
        .co-prod-meta h3 { font-size: 1.15rem; font-weight: 800; margin-bottom: 4px; line-height: 1.3; }
        .co-prod-meta p { font-size: 0.8rem; color: var(--co-text-sec); margin-bottom: 6px; }
        .co-prod-price { font-size: 1.2rem; font-weight: 800; color: #FFF; }
        .co-prod-strike { font-size: 0.9rem; text-decoration: line-through; color: var(--co-text-mut); margin-left: 6px; }

        .co-summary-divider { height: 1px; background: var(--co-border); margin: 16px 0; }

        .co-summary-line {
          display: flex;
          justify-content: space-between;
          font-size: 0.88rem;
          color: var(--co-text-sec);
          margin-bottom: 10px;
        }
        .co-discount-line { color: #34D399; font-weight: 700; }
        .co-total-line {
          font-size: 1.15rem;
          font-weight: 800;
          color: #FFF;
          margin-top: 8px;
        }
        .co-total-val { font-size: 1.5rem; color: #FFF; }

        .co-feature-bullets { margin-top: 24px; }
        .co-bullet {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.85rem;
          color: var(--co-text-sec);
          margin-bottom: 10px;
        }
        .co-bullet svg { color: #10B981; flex-shrink: 0; }

        @media (max-width: 840px) {
          .co-grid { grid-template-columns: 1fr; }
          .co-form-card { order: 1; }
          .co-summary-card { order: 2; }
        }
      `}} />
    </div>
  );
}

export default function MeeshoCheckoutPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: '#FFF' }}>Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
