'use client';

import { useToast } from '@/components/ToastProvider';
import { useState, useEffect, useCallback } from 'react';

interface GatewayConfig {
  id: string;
  provider: string;
  api_key: string | null;
  api_secret: string | null;
  webhook_secret: string | null;
  extra_config: Record<string, unknown>;
  active: boolean;
}

const gatewayInfo: Record<string, { name: string; description: string; fields: { key: string; label: string; placeholder: string }[] }> = {
  razorpay: {
    name: 'Razorpay',
    description: 'Popular Indian payment gateway. Supports UPI, cards, netbanking, and wallets.',
    fields: [
      { key: 'api_key', label: 'Key ID', placeholder: 'rzp_live_...' },
      { key: 'api_secret', label: 'Key Secret', placeholder: 'Your Razorpay key secret' },
      { key: 'webhook_secret', label: 'Webhook Secret', placeholder: 'Your webhook secret' },
    ],
  },
  payu: {
    name: 'PayU',
    description: 'Indian payment gateway with wide coverage across payment methods.',
    fields: [
      { key: 'api_key', label: 'Merchant Key', placeholder: 'Your PayU merchant key' },
      { key: 'api_secret', label: 'Merchant Salt', placeholder: 'Your PayU merchant salt' },
    ],
  },
  paypal: {
    name: 'PayPal',
    description: 'International payment gateway. Best for global customers paying in USD.',
    fields: [
      { key: 'api_key', label: 'Client ID', placeholder: 'Your PayPal client ID' },
      { key: 'api_secret', label: 'Client Secret', placeholder: 'Your PayPal client secret' },
      { key: 'webhook_secret', label: 'Webhook ID', placeholder: 'Your PayPal webhook ID' },
    ],
  },
  cashfree: {
    name: 'Cashfree',
    description: 'Powerful Indian payment gateway with comprehensive coverage.',
    fields: [
      { key: 'api_key', label: 'App ID', placeholder: 'Your Cashfree App ID' },
      { key: 'api_secret', label: 'Secret Key', placeholder: 'Your Cashfree Secret Key' },
      { key: 'webhook_secret', label: 'Webhook Secret', placeholder: 'Your webhook secret (optional/if needed)' },
    ],
  },
};

export default function PaymentsPage() {
  const [configs, setConfigs] = useState<GatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { showToast } = useToast();
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [products, setProducts] = useState<any[]>([]);
  const [productSaving, setProductSaving] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    try {
      const [res, prodRes] = await Promise.all([
        fetch('/api/admin/gateways'),
        fetch('/api/admin/products')
      ]);
      
      if (prodRes.ok) {
        setProducts(await prodRes.json());
      }

      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
        const initialFormData: Record<string, Record<string, string>> = {};
        data.forEach((config: GatewayConfig) => {
          initialFormData[config.provider] = {
            api_key: config.api_key || '',
            api_secret: config.api_secret || '',
            webhook_secret: config.webhook_secret || '',
            mode: (config.extra_config?.mode as string) || 'test',
          };
        });
        setFormData(initialFormData);
      }
    } catch (err) {
      console.error('Failed to fetch gateway configs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const validateConfig = (provider: string) => {
    const data = formData[provider];
    if (!data) return false;
    const info = gatewayInfo[provider];
    return info.fields.every(f => !!data[f.key]?.trim());
  };

  const handleSave = async (provider: string) => {
    if (!validateConfig(provider)) {
      showToast("Please fill all required fields", "error");
      return;
    }
    setSaving(provider);
    try {
      const res = await fetch(`/api/admin/gateways/${provider}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData[provider]),
      });
      if (res.ok) {
        showToast(`${gatewayInfo[provider].name} settings saved!`, 'success');
        fetchConfigs();
      } else {
        throw new Error('Failed to save');
      }
    } catch {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(null);
    }
  };


  const handleProductGateway = async (productId: string, slug: string, provider: string) => {
    setProductSaving(productId);
    try {
      const p = products.find(prod => prod.id === productId);
      const newConfig = { ...(p.checkout_config || {}), gateway: provider };
      
      const res = await fetch(`/api/admin/products/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkout_config: newConfig })
      });
      if (res.ok) {
        showToast('Product gateway updated', 'success');
        setProducts(products.map(prod => prod.id === productId ? { ...prod, checkout_config: newConfig } : prod));
      }
    } catch (e) {
      showToast('Failed to update product', 'error');
    } finally {
      setProductSaving(null);
    }
  };

  const toggleActive = async (provider: string, active: boolean) => {
    if (active && !validateConfig(provider)) {
      showToast("Please fill all fields and save before activating", "error");
      return;
    }
    try {
      const res = await fetch(`/api/admin/gateways/${provider}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      if (res.ok) {
        showToast(`${gatewayInfo[provider].name} ${active ? 'activated' : 'deactivated'}`, 'success');
        fetchConfigs();
      }
    } catch {
      showToast('Failed to update', 'error');
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
        Configure your payment gateway API keys. Each product can use a different gateway.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {configs.map((config) => {
          const info = gatewayInfo[config.provider];
          if (!info) return null;

          return (
            <div key={config.provider} className="card">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-1)' }}>
                    {info.name}
                  </h3>
                  <p className="text-sm text-muted">{info.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${formData[config.provider]?.mode === 'live' ? 'badge-error' : 'badge-warning'}`}>
                    {formData[config.provider]?.mode === 'live' ? 'LIVE MODE' : 'TEST MODE'}
                  </span>
                  <span className={`badge ${config.active ? 'badge-success' : 'badge-neutral'}`}>
                    {config.active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    className={`btn btn-sm ${config.active ? 'btn-secondary' : 'btn-gold'}`}
                    onClick={() => toggleActive(config.provider, !config.active)}
                  >
                    {config.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {info.fields.map((field) => (
                  <div key={field.key} className="form-group">
                    <label className="form-label">{field.label}</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        className="form-input"
                        style={{ flex: 1 }}
                        type={field.key === 'webhook_secret' || showSecrets[config.provider +  field.key] ? 'text' : 'password'}
                        placeholder={field.placeholder}
                        value={formData[config.provider]?.[field.key] || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [config.provider]: {
                              ...formData[config.provider],
                              [field.key]: e.target.value,
                            },
                          })
                        }
                      />
                      {field.key !== 'webhook_secret' && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setShowSecrets(prev => ({ ...prev, [config.provider + field.key]: !prev[config.provider + field.key] }))}
                        >
                          {showSecrets[config.provider +  field.key] ? 'Hide' : 'Show'}
                        </button>
                      )}
                      {field.key === 'webhook_secret' && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            const array = new Uint8Array(16);
                            crypto.getRandomValues(array);
                            const randomSecret = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
                            setFormData({
                              ...formData,
                              [config.provider]: {
                                ...formData[config.provider],
                                [field.key]: randomSecret,
                              },
                            });
                          }}
                        >
                          Generate
                        </button>
                      )}
                    </div>
                    {field.key === 'webhook_secret' && (
                      <p className="text-xs text-muted mt-1">
                        Generate a secure secret here, save settings, and paste this exact string into your {info.name} dashboard webhook settings.
                      </p>
                    )}
                  </div>
                ))}

                <div className="form-group">
                  <label className="form-label">Environment Mode</label>
                  <select
                    className="form-input"
                    value={formData[config.provider]?.mode || 'test'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [config.provider]: {
                          ...formData[config.provider],
                          mode: e.target.value,
                        },
                      })
                    }
                  >
                    <option value="test">Test Mode</option>
                    <option value="live">Live / Production</option>
                  </select>
                  <p className="text-xs text-muted mt-1">Select whether this gateway is in test or live mode.</p>
                </div>


                {/* Connection Test & Webhook */}
                <div style={{ marginTop: 'var(--space-2)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-light)' }}>
                  <div className="form-group mb-4">
                    <label className="form-label">Webhook URL (Read-only)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        className="form-input text-muted text-sm"
                        style={{ flex: 1, backgroundColor: 'var(--color-bg-alt)' }}
                        readOnly
                        value={`https://${typeof window !== 'undefined' ? window.location.host : 'daevik.in'}/api/webhooks/${config.provider}`}
                      />
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`https://${typeof window !== 'undefined' ? window.location.host : 'daevik.in'}/api/webhooks/${config.provider}`);
                          showToast('Webhook URL copied!', 'success');
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSave(config.provider)}
                    disabled={saving === config.provider}
                  >
                    {saving === config.provider ? (
                      <><span className="spinner" style={{ borderTopColor: 'white', width: '14px', height: '14px' }}></span> Saving...</>
                    ) : (
                      'Save Settings'
                    )}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={async () => {
                      showToast(`Testing connection for ${info.name}...`, 'info');
                      try {
                        const res = await fetch(`/api/admin/gateways/${config.provider}/test`, { method: 'POST' });
                        if (res.ok) {
                          showToast(`Connection successful for ${info.name}!`, 'success');
                        } else {
                          showToast(`Connection failed for ${info.name}`, 'error');
                        }
                      } catch (e) {
                        showToast('Error testing connection', 'error');
                      }
                    }}
                  >
                    Test Connection
                  </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      <div className="card mt-8">
        <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>Per-Product Gateway Assignment</h3>
        <p className="text-secondary text-sm mb-4">Assign a specific payment gateway for each product. Defaults to the first active gateway.</p>
        
        {products.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Gateway</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td className="font-semibold text-sm">{p.name}</td>
                    <td>
                      <select 
                        className="form-input text-sm" 
                        value={p.checkout_config?.gateway || 'default'}
                        onChange={(e) => handleProductGateway(p.id, p.slug, e.target.value)}
                        disabled={productSaving === p.id}
                      >
                        <option value="default">Auto (First Active)</option>
                        {configs.map(c => (
                          <option key={c.provider} value={c.provider}>{gatewayInfo[c.provider]?.name || c.provider}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {productSaving === p.id && <span className="text-xs text-muted">Saving...</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-muted">No products found.</div>
        )}
      </div>

    </div>
  );
}
