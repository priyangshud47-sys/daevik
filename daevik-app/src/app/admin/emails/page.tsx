'use client';

import { useState, useEffect, useCallback } from 'react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  sender_name: string;
  is_default: boolean;
  updated_at: string;
}

export default function EmailsPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState({ name: '', subject: '', body: '', sender_name: '' });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [smtpForm, setSmtpForm] = useState({
    host: '', port: '587', secure: false, username: '', password: '', from_email: '', from_name: '', active: false,
  });
  const [savingSmtp, setSavingSmtp] = useState(false);

  const fetchSmtpConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/smtp');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setSmtpForm({
            host: data.host || '',
            port: data.port?.toString() || '587',
            secure: data.secure || false,
            username: data.username || '',
            password: data.password || '',
            from_email: data.from_email || '',
            from_name: data.from_name || '',
            active: data.active || false,
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch SMTP config:', err);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/emails');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
        if (data.length > 0 && !editing) {
          setEditing(data[0]);
          setForm({
            name: data[0].name,
            subject: data[0].subject,
            body: data[0].body,
            sender_name: data[0].sender_name,
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  }, [editing]);

  useEffect(() => { 
    fetchTemplates(); 
    fetchSmtpConfig();
  }, [fetchTemplates, fetchSmtpConfig]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/emails/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        showToast('Template saved!', 'success');
        fetchTemplates();
      } else {
        throw new Error('Failed to save');
      }
    } catch {
      showToast('Failed to save template', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSmtp = async () => {
    setSavingSmtp(true);
    try {
      const res = await fetch('/api/admin/smtp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpForm),
      });

      if (res.ok) {
        showToast('SMTP settings saved!', 'success');
      } else {
        throw new Error('Failed to save');
      }
    } catch {
      showToast('Failed to save SMTP settings', 'error');
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleTestSend = async () => {
    if (!testEmail || !editing) return;
    setTesting(true);

    try {
      const res = await fetch('/api/admin/emails/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: editing.id,
          to: testEmail,
        }),
      });

      if (res.ok) {
        showToast(`Test email sent to ${testEmail}!`, 'success');
        setTestEmail('');
      } else {
        throw new Error('Failed to send');
      }
    } catch {
      showToast('Failed to send test email', 'error');
    } finally {
      setTesting(false);
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
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* Editor */}
        <div className="card" style={{ gridColumn: 'span 1' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-6)' }}>
            Edit Template
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Template Name</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Sender Name</label>
              <input className="form-input" value={form.sender_name} onChange={(e) => setForm({ ...form, sender_name: e.target.value })} placeholder="Daevik" />
            </div>

            <div className="form-group">
              <label className="form-label">Subject Line</label>
              <input className="form-input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              <span className="form-hint">
                Available placeholders: {'{{customer_name}}'}, {'{{product_name}}'}, {'{{order_id}}'}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Email Body (HTML)</label>
              <textarea
                className="form-textarea"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={12}
                style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}
              />
              <span className="form-hint">
                Available: {'{{customer_name}}'}, {'{{customer_email}}'}, {'{{product_name}}'}, {'{{product_price}}'}, {'{{download_link}}'}, {'{{order_id}}'}
              </span>
            </div>

            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? (
                <><span className="spinner" style={{ borderTopColor: 'white', width: '14px', height: '14px' }}></span> Saving...</>
              ) : (
                'Save Template'
              )}
            </button>
          </div>
        </div>

        {/* Preview & Test */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="card">
            <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>
              Preview
            </h3>
            <div style={{
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              background: 'white',
              fontSize: 'var(--text-sm)',
            }}>
              <div style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div className="text-xs text-muted">From: {form.sender_name || 'Daevik'}</div>
                <div className="text-xs text-muted">Subject: {form.subject}</div>
              </div>
              <div
                dangerouslySetInnerHTML={{
                  __html: form.body
                    .replace(/\{\{customer_name\}\}/g, 'John Doe')
                    .replace(/\{\{customer_email\}\}/g, 'john@example.com')
                    .replace(/\{\{product_name\}\}/g, 'Sample Product')
                    .replace(/\{\{product_price\}\}/g, '₹999')
                    .replace(/\{\{download_link\}\}/g, 'https://example.com/download')
                    .replace(/\{\{order_id\}\}/g, 'ORD-12345'),
                }}
              />
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>
              Send Test Email
            </h3>
            <div className="flex gap-3">
              <input
                className="form-input"
                type="email"
                placeholder="test@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="btn btn-secondary" onClick={handleTestSend} disabled={testing || !testEmail}>
                {testing ? 'Sending...' : 'Send Test'}
              </button>
            </div>
          </div>

          {/* Email Logs summary */}
          <div className="card">
            <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>
              Template List
            </h3>
            {templates.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  setEditing(t);
                  setForm({ name: t.name, subject: t.subject, body: t.body, sender_name: t.sender_name });
                }}
                style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  background: editing?.id === t.id ? 'var(--color-bg-warm)' : 'transparent',
                  marginTop: 'var(--space-2)',
                }}
              >
                <div className="font-semibold text-sm">{t.name}</div>
                <div className="text-xs text-muted">
                  Last updated: {new Date(t.updated_at).toLocaleDateString('en-IN')}
                </div>
              </div>
            ))}
          </div>
          </div>

          {/* SMTP Configuration */}
          <div className="card">
            <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>
              Custom SMTP Configuration
            </h3>
            <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-4)' }}>
              Use your own SMTP server (e.g. Gmail, AWS SES) instead of the default Resend configuration.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              
              <div className="form-group flex gap-2" style={{ alignItems: 'center' }}>
                <input 
                  type="checkbox" 
                  id="smtp_active"
                  checked={smtpForm.active} 
                  onChange={(e) => setSmtpForm({ ...smtpForm, active: e.target.checked })} 
                />
                <label htmlFor="smtp_active" className="font-semibold cursor-pointer text-sm">
                  Enable Custom SMTP (Overrides Resend)
                </label>
              </div>

              <div className="flex gap-3">
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>SMTP Host</label>
                  <input className="form-input text-sm" placeholder="smtp.gmail.com" value={smtpForm.host} onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Port</label>
                  <input className="form-input text-sm" type="number" placeholder="587" value={smtpForm.port} onChange={(e) => setSmtpForm({ ...smtpForm, port: e.target.value })} />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Username</label>
                  <input className="form-input text-sm" placeholder="youremail@gmail.com" value={smtpForm.username} onChange={(e) => setSmtpForm({ ...smtpForm, username: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Password / App Password</label>
                  <input className="form-input text-sm" type="password" placeholder="••••••••" value={smtpForm.password} onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })} />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>From Name</label>
                  <input className="form-input text-sm" placeholder="Daevik Support" value={smtpForm.from_name} onChange={(e) => setSmtpForm({ ...smtpForm, from_name: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>From Email</label>
                  <input className="form-input text-sm" placeholder="support@daevik.in" value={smtpForm.from_email} onChange={(e) => setSmtpForm({ ...smtpForm, from_email: e.target.value })} />
                </div>
              </div>

              <div className="form-group flex gap-2 mt-2" style={{ alignItems: 'center' }}>
                <input 
                  type="checkbox" 
                  id="smtp_secure"
                  checked={smtpForm.secure} 
                  onChange={(e) => setSmtpForm({ ...smtpForm, secure: e.target.checked })} 
                />
                <label htmlFor="smtp_secure" className="cursor-pointer text-xs">
                  Use Secure Connection (SSL/TLS) - Recommended for port 465
                </label>
              </div>

              <button className="btn btn-secondary" style={{ marginTop: 'var(--space-2)' }} onClick={handleSaveSmtp} disabled={savingSmtp}>
                {savingSmtp ? 'Saving...' : 'Save SMTP Settings'}
              </button>
            </div>
          </div>
        </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
