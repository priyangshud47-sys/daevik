'use client';

import { useToast } from '@/components/ToastProvider';
import { useState, useEffect, useCallback } from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import ToggleSwitch from '@/components/ToggleSwitch';

interface FbConfig {
  id: string;
  pixel_id: string | null;
  access_token: string | null;
  test_event_code: string | null;
  active: boolean;
  updated_at: string;
}

export default function FacebookPage() {
  const [configs, setConfigs] = useState<FbConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ pixel_id: '', access_token: '', test_event_code: '' });
  
  const { showToast } = useToast();
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/facebook');
      if (res.ok) {
        const data = await res.json();
        setConfigs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch Facebook configs:', err);
      showToast('Failed to load configurations', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const handleAdd = async (e: React.FormEvent) => {
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
      const res = await fetch('/api/admin/facebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast('Facebook CAPI added!', 'success');
        setShowAddModal(false);
        setForm({ pixel_id: '', access_token: '', test_event_code: '' });
        fetchConfigs();
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add', 'error');
    } finally {
      setSaving(false);
    }
  };

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
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Pixel
        </button>
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
                  <td style={{ textAlign: 'right' }}>
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
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '20px' }}>
            <h2 className="text-xl font-bold mb-2">Add Facebook Pixel</h2>
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
                  {saving ? 'Saving...' : 'Save Pixel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
