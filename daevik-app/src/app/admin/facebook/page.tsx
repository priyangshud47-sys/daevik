'use client';

import { useToast } from '@/components/ToastProvider';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ConfirmModal from '@/components/ConfirmModal';
import ToggleSwitch from '@/components/ToggleSwitch';

interface FbConfig {
  id: string;
  pixel_id: string | null;
  access_token: string | null;
  test_event_code: string | null;
  active: boolean;
  updated_at: string;
  last_event_at?: string;
}

export default function FacebookPage() {
  const [configs, setConfigs] = useState<FbConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ pixel_id: '', access_token: '', test_event_code: '' });
  
  const { showToast } = useToast();
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/facebook');
      
      if (res.ok) {
        const data = await res.json();
        setConfigs(Array.isArray(data) ? data : []);
      } else {
        const errText = await res.text().catch(() => '');
        console.error(`[Facebook] API returned ${res.status}:`, errText);
        showToast(`Failed to load pixels (HTTP ${res.status})`, 'error');
      }
    } catch (err) {
      console.error('Failed to fetch Facebook configs:', err);
      showToast('Failed to load configurations', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);


  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d+$/.test(form.pixel_id.trim())) {
      showToast('Pixel ID must contain only numbers', 'error');
      return;
    }
    if (form.access_token.trim().length < 20) {
      showToast('Access Token seems too short to be valid', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { id: editingId, ...form } : form;
      
      const res = await fetch('/api/admin/facebook', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        showToast(`Facebook CAPI ${editingId ? 'updated' : 'added'}!`, 'success');
        setShowAddModal(false);
        setEditingId(null);
        setForm({ pixel_id: '', access_token: '', test_event_code: '' });
        fetchConfigs();
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = submitForm;


  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/facebook`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !currentStatus }),
      });
      if (res.ok) {
        showToast('Status updated', 'success');
        fetchConfigs();
      } else {
        throw new Error('Failed to update status');
      }
    } catch {
      showToast('Failed to update status', 'error');
    }
  };


  const handleSendTestEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/facebook/test?id=${id}`, { method: 'POST' });
      if (res.ok) {
        showToast('Test event sent successfully!', 'success');
      } else {
        showToast('Failed to send test event', 'error');
      }
    } catch (e) {
      showToast('Error sending test event', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/facebook?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Deleted successfully', 'success');
        fetchConfigs();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (err) {
      showToast('Error deleting configuration', 'error');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading...</div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-1)' }}>Facebook CAPI</h1>
          <p className="text-secondary">Manage your Facebook Pixel and Conversions API connections</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm({ pixel_id: '', access_token: '', test_event_code: '' }); setShowAddModal(true); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Pixel
        </button>
      </div>

      


      <div className="card mb-8" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 className="text-base font-bold mb-1">Google Ads &amp; Analytics Tracking</h3>
          <p className="text-secondary text-sm m-0">Configure Google Ads Conversion IDs, Purchase Conversion Labels, and GA4.</p>
        </div>
        <Link href="/admin/google" className="btn btn-secondary btn-sm">
          Open Google Tracking &rarr;
        </Link>
      </div>

      {/* List of Pixels */}
      {configs.length > 0 ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Pixel ID</th>
                <th>Access Token</th>
                <th>Test Event Code</th>
                <th>Status</th>
                <th>Last Event</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="font-semibold">{c.pixel_id || 'N/A'}</div>
                  </td>
                  <td>
                    <span className="text-sm text-muted" style={{ fontFamily: 'monospace' }}>
                      {c.access_token ? `${c.access_token.substring(0, 15)}...` : 'None'}
                    </span>
                  </td>
                  <td>
                    {c.test_event_code ? (
                      <span className="badge badge-neutral">{c.test_event_code}</span>
                    ) : (
                      <span className="text-sm text-muted">None</span>
                    )}
                  </td>
                  <td>
                    <ToggleSwitch checked={c.active} onChange={() => toggleActive(c.id, c.active)} />
                  </td>
                  <td>
                    <span className="text-xs text-muted">
                      {c.last_event_at ? new Date(c.last_event_at).toLocaleString() : 'Never'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn btn-sm btn-ghost text-success"
                      onClick={() => handleSendTestEvent(c.id)}
                    >
                      Test Event
                    </button>
                    <button 
                      className="btn btn-sm btn-ghost" 
                      onClick={() => {
                        setEditingId(c.id);
                        setForm({ pixel_id: c.pixel_id || '', access_token: c.access_token || '', test_event_code: c.test_event_code || '' });
                        setShowAddModal(true);
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-ghost text-error" 
                      onClick={() => setItemToDelete(c.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-12">
          <h3 className="text-lg font-bold mb-2">No Pixels Configured</h3>
          <p className="text-secondary mb-6">Click "Add Pixel" to connect your Facebook tracking.</p>
          <button className="btn btn-primary mx-auto" onClick={() => setShowAddModal(true)}>
            Add Pixel
          </button>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Facebook Config"
        message="Are you sure you want to delete this configuration? Tracking will stop immediately."
        confirmText="Delete"
        onConfirm={() => {
          if (itemToDelete) handleDelete(itemToDelete);
          setItemToDelete(null);
        }}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '20px', backgroundColor: 'var(--color-bg-card)' }}>
            <h2 className="text-xl font-bold mb-2">{editingId ? 'Edit Facebook Pixel' : 'Add Facebook Pixel'}</h2>
            <p className="text-secondary mb-6">Enter your Facebook tracking credentials.</p>
            
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="text-sm font-semibold mb-1 block">Pixel ID <span className="text-error">*</span></label>
                <input 
                  type="text"
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.pixel_id} 
                  onChange={(e) => setForm({ ...form, pixel_id: e.target.value })} 
                  placeholder="e.g. 1234567890123"
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-1 block">Conversions API Access Token <span className="text-error">*</span></label>
                <textarea 
                  required
                  value={form.access_token} 
                  onChange={(e) => setForm({ ...form, access_token: e.target.value })} 
                  placeholder="EAAB..."
                  rows={4}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>
              
              <div>
                <label className="text-sm font-semibold mb-1 block">Test Event Code (Optional)</label>
                <input 
                  type="text" 
                  value={form.test_event_code} 
                  onChange={(e) => setForm({ ...form, test_event_code: e.target.value })} 
                  placeholder="TESTXXXXX"
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (editingId ? 'Update Pixel' : 'Save Pixel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
