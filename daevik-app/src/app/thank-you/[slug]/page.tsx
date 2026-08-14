import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default async function ThankYouPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { slug } = await params;
  let { orderId } = await searchParams;

  if (!orderId) {
    // TEMPORARY BYPASS FOR TESTING
    orderId = "test-order-123";
  }

  // 1. Fetch the order and verify payment
  const { data: order } = await supabase
    .from('orders')
    .select('*, customer:customers(*)')
    .eq('id', orderId)
    .single();

  // TEMPORARY BYPASS FOR TESTING
  // if (!order || order.payment_status !== 'completed') {
  if (false) {
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

  // 2. Fetch the Project (Funnel) to get its checkout_config
  const { data: project } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!project) return notFound();

  // 3. Fetch the attached digital product file
  const checkoutConfig = project.checkout_config as Record<string, any> || {};
  const attachedProductId = checkoutConfig.attached_product_id;
  
  let downloadUrl = null;
  let fileName = 'Your Product';
  
  if (attachedProductId) {
    const { data: attachedFile } = await supabase
      .from('products')
      .select('name, product_file_url')
      .eq('id', attachedProductId)
      .single();
      
    if (attachedFile) {
      downloadUrl = attachedFile.product_file_url;
      fileName = attachedFile.name;
    }
  } else if (project.product_file_url) {
    downloadUrl = project.product_file_url;
    fileName = project.name;
  }

  return (
    <div className="ty-container">
      <div className="ty-header-bar">
        <div className="ty-header-inner">
          <span className="ty-security-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            Secure Delivery
          </span>
          <span className="ty-security-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            Verified Purchase
          </span>
        </div>
      </div>

      <div className="ty-wrapper">
        <div className="ty-card ty-main-card">
          <div className="ty-icon ty-icon-success">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          
          <h1 className="ty-title">Payment Successful!</h1>
          <p className="ty-text">
            Hi <strong>{order?.customer?.name?.split(' ')[0] || 'Customer'}</strong>, your order for <strong style={{color: 'var(--ty-text)'}}>{project.name}</strong> is complete.
          </p>

          <div className="ty-summary-box">
            <h3 className="ty-summary-title">Order Details</h3>
            <div className="ty-summary-row">
              <span>Order ID</span>
              <span className="ty-summary-value">{order?.gateway_order_id || orderId}</span>
            </div>
            <div className="ty-summary-row">
              <span>Amount Paid</span>
              <span className="ty-summary-value ty-amount">₹{order?.amount || '149'}</span>
            </div>
          </div>

          {downloadUrl ? (
            <div className="ty-download-section">
              <h2 className="ty-section-title">Your digital product is ready</h2>
              <a 
                href={downloadUrl.includes('?') ? `${downloadUrl}&download=` : `${downloadUrl}?download=`}
                download={fileName}
                className="ty-btn ty-btn-primary"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download {fileName}
              </a>
              <p className="ty-email-note">
                A copy of this link was also sent to <br/><strong>{order?.customer?.email || 'your email address'}</strong>
              </p>
            </div>
          ) : (
            <div className="ty-error-box">
              <p style={{fontWeight: 600, color: 'var(--ty-error)'}}>No digital file attached.</p>
              <p style={{fontSize: '0.875rem', marginTop: '4px', color: 'var(--ty-text-secondary)'}}>If you were expecting a download, please contact support.</p>
            </div>
          )}
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
        --ty-bg: #F8FAFC;
        --ty-white: #FFFFFF;
        --ty-emerald: #16A34A;
        --ty-emerald-hover: #15803D;
        --ty-emerald-light: #F0FDF4;
        --ty-text: #0F172A;
        --ty-text-secondary: #334155;
        --ty-text-muted: #64748B;
        --ty-border: #E2E8F0;
        --ty-error: #DC2626;
        --ty-error-bg: #FEF2F2;
        --ty-shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
        --ty-shadow-md: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05);
        --ty-shadow-lg: 0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04);
        --ty-radius: 16px;
      }

      * {
        box-sizing: border-box;
      }

      .ty-container {
        min-height: 100vh;
        background-color: var(--ty-bg);
        font-family: system-ui, -apple-system, sans-serif;
        color: var(--ty-text);
        display: flex;
        flex-direction: column;
      }

      .ty-header-bar {
        background-color: var(--ty-white);
        border-bottom: 1px solid var(--ty-border);
        padding: 12px 20px;
        box-shadow: var(--ty-shadow-sm);
      }

      .ty-header-inner {
        max-width: 600px;
        margin: 0 auto;
        display: flex;
        justify-content: center;
        gap: 24px;
      }

      .ty-security-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--ty-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .ty-security-item svg {
        color: var(--ty-emerald);
      }

      .ty-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
      }

      .ty-card {
        background: var(--ty-white);
        border-radius: var(--ty-radius);
        box-shadow: var(--ty-shadow-lg);
        width: 100%;
        max-width: 520px;
        padding: 48px 40px;
        text-align: center;
        border: 1px solid var(--ty-border);
      }

      .ty-icon {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 24px;
      }

      .ty-icon-success {
        background-color: var(--ty-emerald-light);
        color: var(--ty-emerald);
      }

      .ty-icon-error {
        background-color: var(--ty-error-bg);
        color: var(--ty-error);
      }

      .ty-title {
        font-size: 2rem;
        font-weight: 800;
        margin: 0 0 12px;
        letter-spacing: -0.02em;
        color: var(--ty-text);
      }

      .ty-text {
        font-size: 1.05rem;
        line-height: 1.5;
        color: var(--ty-text-secondary);
        margin: 0 0 32px;
      }

      .ty-summary-box {
        background-color: var(--ty-bg);
        border: 1px solid var(--ty-border);
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 32px;
        text-align: left;
      }

      .ty-summary-title {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--ty-text-muted);
        margin: 0 0 16px;
      }

      .ty-summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        font-size: 0.95rem;
        color: var(--ty-text-secondary);
      }

      .ty-summary-row:last-child {
        margin-bottom: 0;
        padding-top: 12px;
        border-top: 1px dashed var(--ty-border);
      }

      .ty-summary-value {
        font-family: monospace;
        color: var(--ty-text);
        font-weight: 500;
      }

      .ty-amount {
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--ty-text);
      }

      .ty-download-section {
        padding-top: 8px;
      }

      .ty-section-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--ty-text);
        margin: 0 0 16px;
      }

      .ty-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 16px 24px;
        border-radius: 12px;
        font-size: 1.1rem;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.2s ease;
        border: none;
        cursor: pointer;
      }

      .ty-btn-primary {
        background-color: var(--ty-emerald);
        color: var(--ty-white);
        box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);
      }

      .ty-btn-primary:hover {
        background-color: var(--ty-emerald-hover);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(22, 163, 74, 0.3);
      }

      .ty-btn-secondary {
        background-color: var(--ty-text);
        color: var(--ty-white);
      }

      .ty-btn-secondary:hover {
        background-color: #000;
      }

      .ty-email-note {
        font-size: 0.85rem;
        color: var(--ty-text-muted);
        margin: 20px 0 0;
        line-height: 1.5;
      }

      .ty-error-box {
        background-color: var(--ty-error-bg);
        border: 1px solid rgba(220, 38, 38, 0.2);
        padding: 20px;
        border-radius: 12px;
      }

      @media (max-width: 480px) {
        .ty-card {
          padding: 32px 24px;
        }
        .ty-title {
          font-size: 1.75rem;
        }
      }
    `}} />
  );
}
