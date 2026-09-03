import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import TrackPurchase from '@/components/TrackPurchase';
import DownloadButton from '../[slug]/DownloadButton';

export default async function MeeshoGuideThankYou({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const slug = 'meesho-seller-guide';
  const { orderId } = await searchParams;

  if (!orderId) {
    return (
      <div className="ty-container">
        <div className="ty-card">
          <div className="ty-icon ty-icon-error">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h1 className="ty-title">Access Denied</h1>
          <p className="ty-text">Missing order ID. You need a valid, completed order to access this page.</p>
          <Link href={`/checkout/${slug}`} className="ty-btn ty-btn-secondary">
            Return to Checkout
          </Link>
        </div>
        <StyleBlock />
      </div>
    );
  }

  // 1. Fetch order
  let { data: order } = await supabase
    .from('orders')
    .select('*, customer:customers(*), product:products(*)')
    .eq('id', orderId)
    .single();

  // Synchronous Verification Fallback for Cashfree
  if (order && order.payment_status === 'pending' && order.gateway_used === 'cashfree') {
    const { data: config } = await supabase
      .from('gateway_configs')
      .select('api_key, api_secret, extra_config')
      .eq('provider', 'cashfree')
      .single();

    if (config && config.api_key && config.api_secret) {
      const mode = (config.extra_config as Record<string, string>)?.mode || 'test';
      const baseUrl = mode === 'live' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
      try {
        const res = await fetch(`${baseUrl}/orders/${order.id}`, {
          headers: {
            'x-client-id': config.api_key,
            'x-client-secret': config.api_secret,
            'x-api-version': '2023-08-01'
          }
        });
        if (res.ok) {
          const cfData = await res.json();
          if (cfData.order_status === 'PAID') {
            const { headers: getHeaders } = await import('next/headers');
            const reqHeaders = await getHeaders();
            const host = reqHeaders.get('host') || 'daevik.in';
            const protocol = host.includes('localhost') ? 'http' : 'https';
            const appUrl = `${protocol}://${host}`;

            const { processOrderCompletion } = await import('@/lib/order-processing');
            await processOrderCompletion(
              order.id,
              cfData.cf_order_id ? cfData.cf_order_id.toString() : null,
              cfData,
              'Cashfree',
              appUrl
            );

            order.payment_status = 'completed';
          }
        }
      } catch (e) {
        console.error('Failed synchronous Cashfree verification:', e);
      }
    }
  }

  if (!order || order.payment_status !== 'completed' || !order.product || order.product.slug !== slug) {
    return (
      <div className="ty-container">
        <div className="ty-card">
          <div className="ty-icon ty-icon-error">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h1 className="ty-title">Access Denied</h1>
          <p className="ty-text">You need a valid, completed order to access this page.</p>
          <Link href={`/checkout/${slug}`} className="ty-btn ty-btn-secondary">
            Return to Checkout
          </Link>
        </div>
        <StyleBlock />
      </div>
    );
  }

  const { data: project } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!project) return notFound();

  const downloadUrl = `/api/download/${order.id}`;
  const fileName = 'Start Selling on Meesho - Business Guide (2026 Edition).pdf';

  return (
    <div className="ty-container">
      {order && project && (
        <TrackPurchase
          orderId={order.id}
          value={order.amount}
          currency={order.currency}
          productName={project.name}
          productId={project.id}
          eventId={`purchase_${order.id}`}
          customerEmail={order.customer?.email}
          customerPhone={order.customer?.phone}
          customerName={order.customer?.name}
        />
      )}

      <div className="ty-card">
        <div className="ty-icon ty-icon-success">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>

        <span className="ty-badge">PAYMENT SUCCESSFUL</span>
        <h1 className="ty-title">Thank You for Your Order!</h1>
        <p className="ty-text">
          Your payment of <strong>₹{order.amount}</strong> was received successfully. Your complete Meesho Business Guide and launch bonuses are ready for download below.
        </p>

        <div className="ty-order-info">
          <div className="ty-info-row">
            <span>Order ID</span>
            <strong>{order.id.slice(0, 13)}...</strong>
          </div>
          <div className="ty-info-row">
            <span>Customer Name</span>
            <strong>{order.customer?.name || 'Customer'}</strong>
          </div>
          <div className="ty-info-row">
            <span>Email</span>
            <strong>{order.customer?.email}</strong>
          </div>
          <div className="ty-info-row">
            <span>Product</span>
            <strong>Start Selling on Meesho Guide (2026)</strong>
          </div>
        </div>

        <div className="ty-download-box">
          <h3>Your Files Are Ready</h3>
          <p>Click below to download your complete 15-chapter handbook and spreadsheets.</p>
          <div style={{ marginTop: '16px' }}>
            <DownloadButton downloadUrl={downloadUrl} fileName={fileName} />
          </div>
        </div>

        <div className="ty-email-notice">
          📧 <strong>Confirmation Email Sent:</strong> A copy of your download link and tax invoice has also been sent to <strong>{order.customer?.email}</strong>. (Please check your Spam/Promotions folder if not seen within 2 minutes).
        </div>

        <div className="ty-support-note">
          Need help? Contact our seller support team anytime at <a href="mailto:support@daevik.in">support@daevik.in</a>.
        </div>
      </div>

      <StyleBlock />
    </div>
  );
}

function StyleBlock() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      :root {
        --ty-bg: #0D021A;
        --ty-card: #18052E;
        --ty-border: #35115B;
        --ty-pink: #F43397;
        --ty-text: #FFFFFF;
        --ty-text-sec: #D1C4E9;
        --ty-text-mut: #9480AB;
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: var(--ty-bg); color: var(--ty-text); font-family: 'Inter', system-ui, sans-serif; }

      .ty-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
      }
      .ty-card {
        background: var(--ty-card);
        border: 1px solid var(--ty-border);
        border-radius: 24px;
        padding: 48px 36px;
        max-width: 620px;
        width: 100%;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      }
      .ty-icon {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
      }
      .ty-icon-success {
        background: rgba(16, 185, 129, 0.15);
        color: #10B981;
        border: 2px solid #10B981;
      }
      .ty-icon-error {
        background: rgba(239, 68, 68, 0.15);
        color: #EF4444;
        border: 2px solid #EF4444;
      }
      .ty-badge {
        display: inline-block;
        background: rgba(244, 51, 151, 0.2);
        color: #FF70B8;
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        padding: 4px 12px;
        border-radius: 9999px;
        margin-bottom: 12px;
      }
      .ty-title {
        font-size: 2rem;
        font-weight: 800;
        margin-bottom: 12px;
      }
      .ty-text {
        color: var(--ty-text-sec);
        font-size: 1rem;
        line-height: 1.6;
        margin-bottom: 28px;
      }
      .ty-order-info {
        background: #0E021F;
        border: 1px solid var(--ty-border);
        border-radius: 14px;
        padding: 16px 20px;
        text-align: left;
        margin-bottom: 28px;
      }
      .ty-info-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.9rem;
        color: var(--ty-text-sec);
        padding: 8px 0;
        border-bottom: 1px solid rgba(53, 17, 91, 0.5);
      }
      .ty-info-row:last-child { border-bottom: none; }
      .ty-info-row strong { color: #FFF; }

      .ty-download-box {
        background: rgba(244, 51, 151, 0.08);
        border: 2px dashed var(--ty-pink);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 24px;
      }
      .ty-download-box h3 { font-size: 1.2rem; font-weight: 700; margin-bottom: 6px; }
      .ty-download-box p { font-size: 0.88rem; color: var(--ty-text-sec); }

      .ty-email-notice {
        background: rgba(16, 185, 129, 0.08);
        border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 12px;
        padding: 14px 18px;
        font-size: 0.85rem;
        color: var(--ty-text-sec);
        text-align: left;
        line-height: 1.5;
        margin-bottom: 20px;
      }
      .ty-support-note {
        font-size: 0.82rem;
        color: var(--ty-text-mut);
      }
      .ty-support-note a { color: var(--ty-pink); text-decoration: none; }
      .ty-btn {
        display: inline-block;
        padding: 14px 28px;
        border-radius: 10px;
        font-weight: 700;
        text-decoration: none;
        margin-top: 16px;
      }
      .ty-btn-secondary {
        background: #35115B;
        color: #FFF;
      }
    `}} />
  );
}
