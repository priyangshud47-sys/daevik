'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { trackFbEvent } from '@/lib/fb-client';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';


interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string | null;
  thumbnail_url: string | null;
  gateway_provider: string;
  checkout_page_html: string | null;
}

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState<any>('IN');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });


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

  // Load saved data from localStorage and secure server-side session on initial load
  useEffect(() => {
    // 1. First instantly load from client's browser storage (recent typed data)
    const savedName = localStorage.getItem('daevik_checkout_name');
    const savedEmail = localStorage.getItem('daevik_checkout_email');
    const savedPhone = localStorage.getItem('daevik_checkout_phone');

    if (savedName || savedEmail || savedPhone) {
      setFormData(prev => ({
        ...prev,
        name: savedName || prev.name,
        email: savedEmail || prev.email,
        phone: savedPhone || prev.phone,
      }));
    }

    // 2. Also attempt to fetch from server if they are a returning customer
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
            
            // Save server data to local storage for instant access next time
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
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    localStorage.setItem(`daevik_checkout_${field}`, value);
  };

  const checkoutEventId = useRef(`checkout_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const checkoutEventFired = useRef(false);

  // Track checkout_start funnel event and Facebook CAPI InitiateCheckout
  useEffect(() => {
    if (product) {
      if (checkoutEventFired.current) return;
      checkoutEventFired.current = true;

      const sessionId = sessionStorage.getItem('daevik_session') || `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem('daevik_session', sessionId);

      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          sessionId,
          eventType: 'checkout_start',
        }),
      }).catch(() => {});

      // Facebook CAPI InitiateCheckout
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
          currency: 'INR'
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
    }
  }, [product]);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
        } else {
          setError('Product not found');
        }
      } catch {
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

  // Check for error from payment redirect
  useEffect(() => {
    const paymentError = searchParams.get('error');
    if (paymentError) {
      setError('Payment failed. Please try again.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setSubmitting(true);
    setError(null);

    if (!formData.phone || !isValidPhoneNumber(formData.phone)) {
      setError('Please enter a valid phone number for your country.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSlug: product.slug,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      // Handle gateway-specific checkout flows
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
    // Dynamically load Razorpay script
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
        theme: {
          color: '#6B1D2A',
        },
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
    // Create and submit PayU form
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

  const handleCashfreeCheckout = async (data: {
    paymentSessionId: string;
    mode: string;
    orderId: string;
  }) => {
    // Dynamically load Cashfree script
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

        cf.checkout(checkoutOptions).then((result: any) => {
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

  if (loading) {
    return (
      <div className="checkout-layout">
        <div className="checkout-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="spinner spinner-lg spinner-gold"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="checkout-layout">
        <div className="checkout-container">
          <div className="empty-state">
            <h3>Product Not Found</h3>
            <p>This product doesn&apos;t exist or is no longer available.</p>
            <a href="/" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-layout">
      <div className="checkout-container" style={{ maxWidth: product.checkout_page_html ? '1000px' : '480px' }}>
        {/* Header */}
        <div className="checkout-header">
          <a href="/" className="site-logo">
            Dae<span style={{ color: 'var(--color-secondary)' }}>vik</span>
          </a>
          <p className="text-sm text-muted" style={{ marginTop: 'var(--space-2)' }}>Secure Checkout</p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-8)', flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {product.checkout_page_html && (
            <div className="checkout-custom-html animate-fade-in-up" style={{ flex: '1 1 400px' }} dangerouslySetInnerHTML={{ __html: product.checkout_page_html }} />
          )}
          
          {/* Checkout Card */}
          <div className="checkout-card animate-fade-in-up" style={{ flex: product.checkout_page_html ? '0 0 400px' : '1 1 100%' }}>
          {/* Product Summary */}
          <div className="checkout-product-summary">
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-warm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
            }}>
              {product.thumbnail_url ? (
                <img src={product.thumbnail_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-text-muted)' }}>
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              )}
            </div>
            <div className="checkout-product-info">
              <h3>{product.name}</h3>
              <div className="checkout-product-price">
                ₹{product.price.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'var(--color-error-bg)',
              color: 'var(--color-error)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-4)',
              fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="checkout-name" className="form-label">Full Name</label>
              <input
                id="checkout-name"
                name="name"
                type="text"
                className="form-input"
                placeholder="Your full name"
                required
                autoComplete="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="checkout-email" className="form-label">Email Address</label>
              <input
                id="checkout-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="your@email.com"
                required
                autoComplete="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
              <span className="form-hint">Your product will be delivered to this email</span>
            </div>

            <div className="form-group">
              <label htmlFor="checkout-phone" className="form-label">
                Phone Number
              </label>
              <PhoneInput
                key={country}
                id="checkout-phone"
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
              />
            </div>

            {/* Price Breakdown */}
            <div style={{
              background: 'var(--color-bg-warm)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
            }}>
              <div className="flex justify-between" style={{ marginBottom: 'var(--space-2)' }}>
                <span className="text-sm text-secondary">Product</span>
                <span className="text-sm font-semibold">₹{product.price.toLocaleString('en-IN')}</span>
              </div>
              <div style={{
                borderTop: '1px solid var(--color-border)',
                paddingTop: 'var(--space-2)',
              }} className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary" style={{ fontSize: 'var(--text-lg)' }}>
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
              style={{ width: '100%' }}
            >
              {submitting ? (
                <>
                  <span className="spinner" style={{ borderTopColor: 'white', width: '16px', height: '16px' }}></span>
                  Processing...
                </>
              ) : (
                <>
                  Pay ₹{product.price.toLocaleString('en-IN')}
                </>
              )}
            </button>
          </form>

          {/* Trust Badges */}
          <div className="checkout-trust">
            <span className="trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Secure Payment
            </span>
            <span className="trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Instant Delivery
            </span>
            <span className="trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Encrypted
            </span>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
