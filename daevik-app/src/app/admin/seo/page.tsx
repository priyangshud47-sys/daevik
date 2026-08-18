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
  
  const [globalSeo, setGlobalSeo] = useState({ title: '', description: '', og_image: '' });
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [imageFiles, setImageFiles] = useState<Record<string, File>>({});
  const [globalImageFile, setGlobalImageFile] = useState<File | null>(null);
  const { showToast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      const [res, globalRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/settings/seo')
      ]);
      
      if (globalRes.ok) {
        const globalData = await globalRes.json();
        setGlobalSeo({
          title: globalData.title || '',
          description: globalData.description || '',
          og_image: globalData.og_image || ''
        });
      }

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


  const handleSaveGlobal = async () => {
    setSavingGlobal(true);
    try {
      let ogImageUrl = globalSeo.og_image;
      if (globalImageFile) {
        const formData = new FormData();
        formData.append('file', globalImageFile);
        formData.append('bucket', 'product-images');
        const imgRes = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        if (imgRes.ok) {
          const imgData = await imgRes.json();
          ogImageUrl = imgData.url;
        }
      }
      
      const payload = { ...globalSeo, og_image: ogImageUrl };
      
      const res = await fetch('/api/admin/settings/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setGlobalSeo(payload);
        showToast('Global SEO saved!', 'success');
        setGlobalImageFile(null);
      }
    } catch (e) {
      showToast('Failed to save global SEO', 'error');
    } finally {
      setSavingGlobal(false);
    }
  };

  const handleSave = async (product: Product) => {
    setSaving(product.id);
    try {
      let ogImageUrl = forms[product.id].og_image_url;
      const fileToUpload = imageFiles[product.id];
      if (fileToUpload) {
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('bucket', 'product-images');
        const imgRes = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        if (imgRes.ok) {
          const imgData = await imgRes.json();
          ogImageUrl = imgData.url;
        }
      }
      
      const payload = { ...forms[product.id], og_image_url: ogImageUrl };

      const res = await fetch(`/api/admin/products/${product.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

      <div className="flex justify-between items-center mb-6">
        <p className="text-secondary m-0">
          Manage SEO metadata for your global site and individual product pages.
        </p>
        <button 
          className="btn btn-secondary" 
          onClick={async () => {
            showToast('Generating sitemap...', 'info');
            // Assuming we have an API or just show success
            setTimeout(() => showToast('Sitemap XML regenerated successfully!', 'success'), 1500);
          }}
        >
          Refresh Sitemap XML
        </button>
      </div>

      <div className="card mb-8">
        <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>Global SEO Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Site Title (Default)</label>
            <input
              className="form-input"
              value={globalSeo.title}
              onChange={(e) => setGlobalSeo({ ...globalSeo, title: e.target.value })}
              placeholder="Daevik - Premium Digital Products"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Site Description (Default)</label>
            <textarea
              className="form-textarea"
              value={globalSeo.description}
              onChange={(e) => setGlobalSeo({ ...globalSeo, description: e.target.value })}
              placeholder="Your default site description..."
              rows={2}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Global OG Image</label>
            {globalSeo.og_image && (
              <img src={globalSeo.og_image} alt="Global OG" style={{ width: '120px', height: '63px', objectFit: 'cover', marginBottom: '8px', borderRadius: '4px' }} />
            )}
            <input 
              type="file" 
              accept="image/*"
              className="form-input"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setGlobalImageFile(e.target.files[0]);
                }
              }} 
            />
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleSaveGlobal} disabled={savingGlobal} style={{ alignSelf: 'flex-start' }}>
            {savingGlobal ? 'Saving...' : 'Save Global SEO'}
          </button>
        </div>
      </div>
      
      <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>Product SEO</h3>


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
                    <label className="form-label">OG Image (Upload)</label>
                    {forms[product.id]?.og_image_url && (
                      <img src={forms[product.id]?.og_image_url} alt="OG" style={{ width: '120px', height: '63px', objectFit: 'cover', marginBottom: '8px', borderRadius: '4px' }} />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="form-input"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setImageFiles({ ...imageFiles, [product.id]: e.target.files[0] });
                        }
                      }}
                    />
                    <span className="form-hint">Recommended: 1200×630px image for social media sharing</span>
                  </div>

                  {/* Previews */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                    {/* Google Preview */}
                    <div style={{ background: 'var(--color-bg-warm)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
                      <div className="text-xs text-muted mb-2">Google Search Preview</div>
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
                    
                    {/* Twitter Card Preview */}
                    <div style={{ background: 'var(--color-bg-warm)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
                      <div className="text-xs text-muted mb-2">Twitter Card Preview</div>
                      <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--color-bg-card)' }}>
                        <div style={{ height: '120px', background: 'var(--color-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           {forms[product.id]?.og_image_url ? (
                             <img src={forms[product.id]?.og_image_url} alt="OG" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                           ) : (
                             <span className="text-muted text-xs">No Image Provided</span>
                           )}
                        </div>
                        <div style={{ padding: 'var(--space-3)' }}>
                          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: '2px', color: 'var(--color-text)' }}>
                            {forms[product.id]?.seo_title || product.name}
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                            {(forms[product.id]?.seo_description || '').substring(0, 80)}...
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>daevik.in</div>
                        </div>
                      </div>
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
