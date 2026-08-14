'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string | null;
  tag: string | null;
  checkout_config: Record<string, any>;
  gateway_provider: string;
  status: string;
  created_at: string;
}

export default function ProjectConfigPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  
  const [project, setProject] = useState<Product | null>(null);
  const [digitalProducts, setDigitalProducts] = useState<Product[]>([]);
  const [fbConfigs, setFbConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [price, setPrice] = useState('0');
  const [attachedProductId, setAttachedProductId] = useState('');
  const [gatewayProvider, setGatewayProvider] = useState('razorpay');
  const [fbPixelId, setFbPixelId] = useState('');
  const [gaId, setGaId] = useState('');
  const [gtmId, setGtmId] = useState('');

  const fetchProjectAndProducts = useCallback(async () => {
    try {
      // Fetch the specific project
      const projectRes = await fetch(`/api/admin/products/${slug}`);
      if (!projectRes.ok) throw new Error('Failed to fetch project');
      const projectData = await projectRes.json();
      
      setProject(projectData);
      setPrice(projectData.price.toString());
      setGatewayProvider(projectData.gateway_provider || 'razorpay');
      
      const config = projectData.checkout_config || {};
      setAttachedProductId(config.attached_product_id || '');
      setFbPixelId(config.fb_pixel_id || '');
      setGaId(config.google_analytics_id || '');
      setGtmId(config.google_tag_manager_id || '');

      // Fetch digital files (Products)
      const productsRes = await fetch('/api/admin/products?type=file');
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setDigitalProducts(productsData);
      }

      // Fetch Facebook CAPIs
      const fbRes = await fetch('/api/admin/facebook');
      if (fbRes.ok) {
        const fbData = await fbRes.json();
        setFbConfigs(Array.isArray(fbData) ? fbData : []);
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error loading project', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProjectAndProducts();
  }, [fetchProjectAndProducts]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    
    setSaving(true);
    
    // Merge new config with existing config
    const updatedConfig = {
      ...(project.checkout_config || {}),
      attached_product_id: attachedProductId,
      fb_pixel_id: fbPixelId,
      google_analytics_id: gaId,
      google_tag_manager_id: gtmId,
    };

    try {
      const res = await fetch(`/api/admin/products/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: parseFloat(price),
          gateway_provider: gatewayProvider,
          checkout_config: updatedConfig,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to update project');
      }
      
      setToast({ message: 'Project configuration saved successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Error saving', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted">Loading Project Details...</div>;
  if (!project) return <div className="p-8 text-center text-error">Project not found</div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="mb-6">
        <Link href="/admin/projects" className="btn btn-ghost btn-sm mb-4" style={{ display: 'inline-flex', alignItems: 'center', padding: '0' }}>
          &larr; Back to Projects
        </Link>
        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-1)' }}>{project.name}</h1>
        <p className="text-secondary">Manage configuration, tracking, and pages for this project.</p>
      </div>

      {toast && (
        <div className={`toast toast-${toast.type} mb-6`}>
          {toast.message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
        {/* Main Config Form */}
        <div className="card">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Delivery Section */}
            <div>
              <h3 className="font-bold mb-4" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>Pricing & Delivery</h3>
              <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <label className="text-sm font-semibold mb-1 block">Project Price (₹)</label>
                  <input 
                    type="number" 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">Deliverable Product (File)</label>
                  <select 
                    value={attachedProductId} 
                    onChange={(e) => setAttachedProductId(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                  >
                    <option value="">-- No File Attached --</option>
                    {digitalProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted mt-1">Select a file from the Products section.</p>
                </div>
              </div>
            </div>

            {/* Tracking Section */}
            <div className="mt-8">
              <h3 className="font-bold mb-4" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>Tracking & Payments</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="text-sm font-semibold mb-1 block">Payment Gateway</label>
                  <select 
                    value={gatewayProvider} 
                    onChange={(e) => setGatewayProvider(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                  >
                    <option value="razorpay">Razorpay</option>
                    <option value="payu">PayU</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-1 block">Facebook Pixel (CAPI)</label>
                  <select 
                    value={fbPixelId} 
                    onChange={(e) => setFbPixelId(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                  >
                    <option value="">-- No Facebook Tracking --</option>
                    {fbConfigs.map(c => (
                      <option key={c.id} value={c.pixel_id || ''}>
                        Pixel: {c.pixel_id}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted mt-1">Select a configuration from the Facebook Admin page.</p>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-1 block">Google Analytics Measurement ID</label>
                  <input 
                    type="text" 
                    value={gaId} 
                    onChange={(e) => setGaId(e.target.value)} 
                    placeholder="e.g. G-XXXXXXX"
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold mb-1 block">Google Tag Manager ID</label>
                  <input 
                    type="text" 
                    value={gtmId} 
                    onChange={(e) => setGtmId(e.target.value)} 
                    placeholder="e.g. GTM-XXXXXXX"
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Links */}
        <div className="card">
          <h3 className="font-bold mb-4">Project Pages</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li>
              <a href={`/product/${project.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'space-between', border: '1px solid var(--color-border)' }}>
                <span>1. Sales Page</span>
                <span style={{ fontSize: '12px' }}>↗</span>
              </a>
            </li>
            <li>
              <a href={`/checkout/${project.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'space-between', border: '1px solid var(--color-border)' }}>
                <span>2. Checkout Page</span>
                <span style={{ fontSize: '12px' }}>↗</span>
              </a>
            </li>
            <li>
              <a href={`/thank-you/${project.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'space-between', border: '1px solid var(--color-border)' }}>
                <span>3. Thank You Page</span>
                <span style={{ fontSize: '12px' }}>↗</span>
              </a>
            </li>
          </ul>
          <p className="text-xs text-muted mt-4">Click to view the live pages for this project.</p>
        </div>
      </div>
    </div>
  );
}
