'use client';

import { useToast } from '@/components/ToastProvider';
import { useState, useEffect, useCallback } from 'react';

interface Product {
  id: string;
  name: string;
  slug: string;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
}

export default function SeoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, { seo_title: string; seo_description: string; og_image_url: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        const initialForms: Record<string, { seo_title: string; seo_description: string; og_image_url: string }> = {};
        data.forEach((p: Product) => {
          initialForms[p.id] = {
            seo_title: p.seo_title || '',
            seo_description: p.seo_description || '',
            og_image_url: p.og_image_url || '',
          };
        });
        setForms(initialForms);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSave = async (product: Product) => {
    setSaving(product.id);
    try {
      const res = await fetch(`/api/admin/products/${product.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forms[product.id]),
      });
      if (res.ok) {
        showToast(`SEO updated for ${product.name}!`, 'success');
        setEditing(null);
      } else {
        throw new Error('Failed to save');
      }
    } catch {
      showToast('Failed to save SEO settings', 'error');
    } finally {
      setSaving(null);
      
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center" style={{ padding: 'var(--space-16)' }}>
        <div className="spinner spinner-lg spinner-gold"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <p className="text-secondary mb-6">
        Manage SEO metadata for each product page. These settings affect how your product pages appear in search results and social media shares.
      </p>

      {products.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {products.map((product) => (
            <div key={product.id} className="card">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-1)' }}>
                    {product.name}
                  </h3>
                  <span className="text-xs text-muted" style={{ fontFamily: 'monospace' }}>
                    /product/{product.slug}
                  </span>
                </div>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setEditing(editing === product.id ? null : product.id)}
                >
                  {editing === product.id ? 'Close' : 'Edit SEO'}
                </button>
              </div>

              {editing === product.id && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-light)' }}>
                  <div className="form-group">
                    <label className="form-label">SEO Title</label>
                    <input
                      className="form-input"
                      value={forms[product.id]?.seo_title || ''}
                      onChange={(e) => setForms({ ...forms, [product.id]: { ...forms[product.id], seo_title: e.target.value } })}
                      placeholder={`${product.name} — Daevik`}
                    />
                    <span className={`form-hint ${(forms[product.id]?.seo_title || '').length > 60 ? 'text-error font-semibold' : ''}`}>
                      {(forms[product.id]?.seo_title || '').length}/60 characters
                      {(forms[product.id]?.seo_title || '').length > 60 && ' (Warning: Title may be truncated in search results)'}
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">SEO Description</label>
                    <textarea
                      className="form-textarea"
                      value={forms[product.id]?.seo_description || ''}
                      onChange={(e) => setForms({ ...forms, [product.id]: { ...forms[product.id], seo_description: e.target.value } })}
                      placeholder="A compelling description for search results..."
                      rows={3}
                    />
                    <span className={`form-hint ${(forms[product.id]?.seo_description || '').length > 160 ? 'text-error font-semibold' : ''}`}>
                      {(forms[product.id]?.seo_description || '').length}/160 characters
                      {(forms[product.id]?.seo_description || '').length > 160 && ' (Warning: Description may be truncated in search results)'}
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">OG Image URL</label>
                    <input
                      className="form-input"
                      value={forms[product.id]?.og_image_url || ''}
                      onChange={(e) => setForms({ ...forms, [product.id]: { ...forms[product.id], og_image_url: e.target.value } })}
                      placeholder="https://..."
                    />
                    <span className="form-hint">Recommended: 1200×630px image for social media sharing</span>
                  </div>

                  {/* Preview */}
                  <div style={{ background: 'var(--color-bg-warm)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
                    <div className="text-xs text-muted mb-2">Search Preview</div>
                    <div style={{ color: '#1a0dab', fontSize: 'var(--text-base)', fontWeight: 500, marginBottom: '2px' }}>
                      {forms[product.id]?.seo_title || `${product.name} — Daevik`}
                    </div>
                    <div style={{ color: '#006621', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                      daevik.in/product/{product.slug}
                    </div>
                    <div className="text-sm" style={{ color: '#545454' }}>
                      {forms[product.id]?.seo_description || `Get ${product.name} from Daevik. Premium digital product with instant delivery.`}
                    </div>
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleSave(product)}
                    disabled={saving === product.id}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    {saving === product.id ? 'Saving...' : 'Save SEO'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <h3>No Products</h3>
            <p>Add products first, then configure their SEO settings.</p>
          </div>
        </div>
      )}

      
    </div>
  );
}
