'use client';
import Link from 'next/link';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const productSlug = searchParams.get('productSlug');

  const [customHtml, setCustomHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!productSlug);

  useEffect(() => {
    if (productSlug) {
      fetch(`/api/admin/products/${productSlug}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.thank_you_page_html) {
            let html = data.thank_you_page_html;
            if (orderId) {
              html = html.replace(/{{order_id}}/g, orderId);
            }
            setCustomHtml(html);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [productSlug, orderId]);

  if (loading) {
    return (
      <div className="checkout-layout">
        <div className="confirmation-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="spinner spinner-lg spinner-gold"></div>
        </div>
      </div>
    );
  }

  if (customHtml) {
    return <div dangerouslySetInnerHTML={{ __html: customHtml }} />;
  }

  return (
    <div className="checkout-layout">
      <div className="confirmation-container animate-fade-in-up">
        {/* Success Icon */}
        <div className="confirmation-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-4)' }}>
          Payment Successful!
        </h1>

        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-6)', lineHeight: 1.6 }}>
          Thank you for your purchase. Your product has been sent to your email address. 
          Please check your inbox (and spam folder, just in case).
        </p>

        {orderId && (
          <div style={{
            background: 'var(--color-bg-warm)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4) var(--space-6)',
            marginBottom: 'var(--space-6)',
            display: 'inline-block',
          }}>
            <span className="text-sm text-muted">Order ID</span>
            <div className="font-semibold" style={{ fontFamily: 'monospace', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
              {orderId}
            </div>
          </div>
        )}

        <div style={{ marginTop: 'var(--space-4)' }}>
          <div style={{
            background: 'var(--color-info-bg)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
            textAlign: 'left',
          }}>
            <p className="text-sm" style={{ color: 'var(--color-info)' }}>
              <strong>📧 Product Delivered via Email</strong><br />
              You&apos;ll receive your product download link at the email address you provided during checkout. 
              If you don&apos;t see it within 5 minutes, please check your spam folder.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'center' }}>
          <Link href="/" className="btn btn-primary btn-lg" style={{ minWidth: '200px' }}>
            Back to Home
          </Link>
          <p className="text-sm text-muted" style={{ marginTop: 'var(--space-2)' }}>
            Need help? Contact us at <a href="mailto:support@daevik.in" style={{ color: 'var(--color-primary)' }}>support@daevik.in</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="checkout-layout">
        <div className="confirmation-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="spinner spinner-lg spinner-gold"></div>
        </div>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
