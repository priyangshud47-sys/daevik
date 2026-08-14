'use client';

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
};

export default function PaymentsPage() {
  const [configs, setConfigs] = useState<GatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/gateways');
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

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (provider: string) => {
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

  const toggleActive = async (provider: string, active: boolean) => {
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
                    <input
                      className="form-input"
                      type="password"
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

                <div>
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
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
