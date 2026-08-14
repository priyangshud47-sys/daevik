'use client';

import { useState, useEffect, useCallback } from 'react';

interface Project {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string | null;
  tag: string | null;
  thumbnail_url: string | null;
  gateway_provider: string;
  fb_pixel_id: string | null;
  fb_access_token: string | null;
  status: string;
  created_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // Old modal logic removed
  
  // Settings for the modal (removed)
  
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/products?type=project');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/products/sync', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to sync projects');
      }
      showToast('Projects synced successfully!', 'success');
      await fetchProjects();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to sync', 'error');
    } finally {
      setSyncing(false);
    }
  };

  // handleSaveConfig removed

  const toggleStatus = async (project: Project) => {
    const newStatus = project.status === 'live' ? 'draft' : 'live';
    try {
      const res = await fetch(`/api/admin/projects/${project.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        showToast(`Project ${newStatus === 'live' ? 'published' : 'unpublished'}!`, 'success');
        fetchProjects();
      }
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/admin/projects/${slug}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      
      showToast('Project deleted!', 'success');
      fetchProjects();
    } catch {
      showToast('Failed to delete project', 'error');
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-1)' }}>Projects</h1>
          <p className="text-secondary">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? (
            <span className="spinner" style={{ borderTopColor: 'white', width: '16px', height: '16px' }}></span>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
          )}
          Sync Local Projects
        </button>
      </div>

      {/* Project Table */}
      {projects.length > 0 ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Slug</th>
                <th>Price</th>
                <th>Gateway</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                        background: 'var(--color-bg-warm)', flexShrink: 0, overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {project.thumbnail_url ? (
                          <img src={project.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-text-muted)' }}>
                            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">{project.name}</div>
                        {project.tag && <span className="text-xs text-muted">{project.tag}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="text-sm text-muted" style={{ fontFamily: 'monospace' }}>/{project.slug}</td>
                  <td className="font-semibold">₹{Number(project.price).toLocaleString('en-IN')}</td>
                  <td>
                    <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                      {project.gateway_provider}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${project.status === 'live' ? 'badge-success' : 'badge-neutral'}`}>
                      {project.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <a href={`/admin/projects/${project.slug}`} className="btn btn-sm btn-ghost">
                        Edit Project
                      </a>
                      <button
                        className={`btn btn-sm ${project.status === 'live' ? 'btn-secondary' : 'btn-gold'}`}
                        onClick={() => toggleStatus(project)}
                      >
                        {project.status === 'live' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button 
                        className="btn btn-sm btn-ghost" 
                        style={{ color: 'var(--color-error)' }}
                        onClick={() => handleDelete(project.slug)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <h3>No Projects Found</h3>
            <p>Design a project locally in Antigravity, then click Sync to add it here.</p>
          </div>
        </div>
      )}

      {/* Configuration Modal Removed */}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
