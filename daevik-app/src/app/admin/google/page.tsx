'use client';

import { useToast } from '@/components/ToastProvider';
import { useState, useEffect, useCallback } from 'react';
import ToggleSwitch from '@/components/ToggleSwitch';

interface GoogleConfig {
  google_ads_id: string;
  purchase_conversion_label: string;
  begin_checkout_conversion_label?: string;
  view_item_conversion_label?: string;
  ga4_id?: string;
  enhanced_conversions: boolean;
  active: boolean;
  updated_at?: string;
}

export default function GoogleTrackingPage() {
  const [config, setConfig] = useState<GoogleConfig>({
    google_ads_id: '',
    purchase_conversion_label: '',
    begin_checkout_conversion_label: '',
    view_item_conversion_label: '',
    ga4_id: '',
    enhanced_conversions: true,
    active: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const { showToast } = useToast();

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings/google');
      if (res.ok) {
        const data = await res.json();
        setConfig(prev => ({
          ...prev,
          ...data,
          enhanced_conversions: data.enhanced_conversions ?? true,
          active: data.active ?? true,
        }));
      } else {
        showToast('Failed to load Google tracking settings', 'error');
      }
    } catch (err) {
      console.error('Failed to fetch Google config:', err);
      showToast('Error loading Google settings', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setTestStatus(null);

    try {
      const res = await fetch('/api/admin/settings/google', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        showToast('Google Ads & Analytics settings saved successfully!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestConversion = () => {
    if (!config.google_ads_id) {
      showToast('Please enter and save your Google Ads Conversion ID first.', 'error');
      return;
    }

    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      const testOrderId = `TEST_${Date.now().toString().slice(-6)}`;
      const adsId = config.google_ads_id.startsWith('AW-')
        ? config.google_ads_id
        : `AW-${config.google_ads_id}`;

      // 1. GA4 Purchase
      window.gtag('event', 'purchase', {
        transaction_id: testOrderId,
        value: 149.00,
        currency: 'INR',
        items: [{ item_id: 'test_product', item_name: 'Test Product', price: 149.00, quantity: 1 }],
      });

      // 2. Google Ads Conversion if label is present
      if (config.purchase_conversion_label) {
        window.gtag('event', 'conversion', {
          send_to: `${adsId}/${config.purchase_conversion_label}`,
          value: 149.00,
          currency: 'INR',
          transaction_id: testOrderId,
        });
      }

      setTestStatus(`✅ Test conversion fired! Transaction ID: ${testOrderId}`);
      showToast(`Test conversion event sent! Check console / Google Tag Assistant.`, 'success');
    } else {
      setTestStatus('⚠️ Google Tag (gtag.js) is not loaded on this admin route. Save settings to activate on store pages.');
      showToast('Settings saved. Google Tag will fire on store & checkout pages.', 'info');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center" style={{ padding: 'var(--space-16)' }}>
        <div className="spinner spinner-lg spinner-gold"></div>
      </div>
    );
  }

  const isConfigured = !!config.google_ads_id || !!config.ga4_id;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-1)' }}>
              Google Ads & Analytics
            </h1>
            <span className={`badge ${config.active && isConfigured ? 'badge-success' : 'badge-neutral'}`}>
              {config.active && isConfigured ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-secondary m-0">
            Set up Google Ads Conversion Tracking, Google Tag (gtag.js), GA4, and Enhanced Conversions.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowGuide(!showGuide)}
          >
            {showGuide ? 'Hide Setup Guide' : '📖 Setup Guide'}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => handleSave()}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Step-by-Step Setup Guide Accordion */}
      {showGuide && (
        <div
          className="card mb-6"
          style={{
            borderLeft: '4px solid var(--color-primary, #6366f1)',
            backgroundColor: 'var(--color-bg-card)',
          }}
        >
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
            🎯 How to get your Google Ads Conversion ID & Purchase Label
          </h3>
          <ol style={{ paddingLeft: '20px', lineHeight: 1.7, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            <li>
              Log in to your <strong>Google Ads Account</strong> (<a href="https://ads.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>ads.google.com</a>).
            </li>
            <li>
              In the top menu, go to <strong>Goals &gt; Conversions &gt; Summary</strong> and click <strong>+ New conversion action</strong>.
            </li>
            <li>
              Select <strong>Website</strong>, enter your store website URL (<code>daevik.in</code>), and click <strong>Scan</strong>.
            </li>
            <li>
              Click <strong>+ Add a conversion action manually</strong>:
              <ul style={{ marginTop: '4px', marginBottom: '8px' }}>
                <li><strong>Goal category</strong>: Select <code>Purchase</code></li>
                <li><strong>Value</strong>: Select <code>Use different values for each conversion</code> (default: <code>INR 149</code>)</li>
                <li><strong>Count</strong>: Select <code>Every</code></li>
              </ul>
            </li>
            <li>
              Click <strong>Done</strong> &gt; <strong>Save and continue</strong>.
            </li>
            <li>
              On the setup page, click <strong>Use Google Tag &gt; See event snippet</strong>:
              <div style={{ background: 'var(--color-bg-warm, #1e1e2d)', padding: '10px 14px', borderRadius: '6px', margin: '8px 0', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                gtag(&apos;event&apos;, &apos;conversion&apos;, &#123; &apos;send_to&apos;: &apos;<span style={{ color: '#4ade80' }}>AW-123456789</span>/<span style={{ color: '#facc15' }}>AbCdEfGhIjKlMnOpQr</span>&apos; &#125;);
              </div>
              Copy the <span style={{ color: '#4ade80', fontWeight: 600 }}>AW-123456789</span> into <strong>Google Ads Conversion ID</strong>, and <span style={{ color: '#facc15', fontWeight: 600 }}>AbCdEfGhIjKlMnOpQr</span> into <strong>Purchase Conversion Label</strong> below!
            </li>
          </ol>
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Google Ads Section */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: '2px' }}>
                Google Ads Conversion Tracking
              </h3>
              <p className="text-sm text-secondary m-0">
                Track ROAS, conversion values, and run Google Ads conversion-optimized campaigns.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">Tracking Active</span>
              <ToggleSwitch
                checked={config.active}
                onChange={() => setConfig(prev => ({ ...prev, active: !prev.active }))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label font-semibold">
                Google Ads Conversion ID / Tag ID <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={config.google_ads_id}
                onChange={e => setConfig({ ...config, google_ads_id: e.target.value })}
                placeholder="e.g. AW-123456789 or 123456789"
                style={{ fontFamily: 'monospace' }}
              />
              <span className="form-hint">
                Found in your Google Tag event snippet. If you enter numbers only, &quot;AW-&quot; will be added automatically.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label font-semibold">
                Purchase Conversion Action Label <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={config.purchase_conversion_label}
                onChange={e => setConfig({ ...config, purchase_conversion_label: e.target.value })}
                placeholder="e.g. AbCdEfGhIjKlMnOpQr"
                style={{ fontFamily: 'monospace' }}
              />
              <span className="form-hint">
                The alphanumeric label after the slash in <code>AW-XXXXX/LABEL</code> for your Purchase conversion action.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label font-semibold">
                  Begin Checkout Label <span className="text-muted text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={config.begin_checkout_conversion_label || ''}
                  onChange={e => setConfig({ ...config, begin_checkout_conversion_label: e.target.value })}
                  placeholder="e.g. BcDeFgHiJkLmNoPqRs"
                  style={{ fontFamily: 'monospace' }}
                />
                <span className="form-hint">
                  Track mid-funnel checkout initiation in Google Ads.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label font-semibold">
                  View Item Label <span className="text-muted text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={config.view_item_conversion_label || ''}
                  onChange={e => setConfig({ ...config, view_item_conversion_label: e.target.value })}
                  placeholder="e.g. CdEfGhIjKlMnOpQrSt"
                  style={{ fontFamily: 'monospace' }}
                />
                <span className="form-hint">
                  Track product views for Google Ads remarketing.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Google Analytics 4 Section */}
        <div className="card mb-6">
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
            Google Analytics 4 (GA4)
          </h3>
          <p className="text-sm text-secondary mb-4">
            Track user journey, ecommerce revenue, funnel drop-offs, and store metrics in GA4.
          </p>

          <div className="form-group">
            <label className="form-label font-semibold">GA4 Measurement ID</label>
            <input
              type="text"
              className="form-input"
              value={config.ga4_id || ''}
              onChange={e => setConfig({ ...config, ga4_id: e.target.value })}
              placeholder="e.g. G-XXXXXXXXXX"
              style={{ fontFamily: 'monospace' }}
            />
            <span className="form-hint">
              Found in GA4 Admin &gt; Data Streams &gt; Web stream details.
            </span>
          </div>
        </div>

        {/* Enhanced Conversions Card */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: '2px' }}>
                Google Enhanced Conversions
              </h3>
              <p className="text-sm text-secondary m-0">
                Securely send first-party customer email and phone to Google Ads for superior match quality.
              </p>
            </div>
            <ToggleSwitch
              checked={config.enhanced_conversions}
              onChange={() => setConfig(prev => ({ ...prev, enhanced_conversions: !prev.enhanced_conversions }))}
            />
          </div>
          <div style={{ background: 'var(--color-info-bg, rgba(99,102,241,0.08))', padding: '12px 16px', borderRadius: '8px', marginTop: '12px' }}>
            <p className="text-xs m-0" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              ⚡ <strong>Why enable Enhanced Conversions?</strong> It matches purchases to signed-in Google users even when third-party cookies are blocked, increasing reported conversion rates by 10-25% and powering Google Smart Bidding algorithms.
            </p>
          </div>
        </div>

        {/* Live Test & Save Controls */}
        <div className="flex justify-between items-center gap-4 card">
          <div>
            <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: '0 0 4px' }}>
              Test Tracking Integration
            </h4>
            <p className="text-xs text-secondary m-0">
              Trigger a test conversion event to verify tag configuration.
            </p>
            {testStatus && (
              <p className="text-xs mt-2 font-mono" style={{ color: 'var(--color-primary)' }}>
                {testStatus}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSendTestConversion}
            >
              Test Conversion
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
