'use client';

import { useState, useEffect, useCallback } from 'react';

interface OrderWithDetails {
  id: string;
  amount: number;
  currency: string;
  gateway_used: string;
  payment_status: string;
  transaction_id: string | null;
  created_at: string;
  product: { name: string; slug: string } | null;
  customer: { name: string; email: string; phone: string | null } | null;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !search ||
      order.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
      order.customer?.email.toLowerCase().includes(search.toLowerCase()) ||
      order.product?.name.toLowerCase().includes(search.toLowerCase()) ||
      order.transaction_id?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.payment_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const exportCSV = () => {
    const headers = ['Order ID', 'Customer Name', 'Email', 'Product', 'Amount', 'Currency', 'Gateway', 'Status', 'Transaction ID', 'Date'];
    const rows = filteredOrders.map((o) => [
      o.id,
      o.customer?.name || '',
      o.customer?.email || '',
      o.product?.name || '',
      o.amount,
      o.currency,
      o.gateway_used,
      o.payment_status,
      o.transaction_id || '',
      new Date(o.created_at).toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daevik-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ message: 'CSV exported successfully!', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  // Stats
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.payment_status === 'completed');
  const pendingOrders = orders.filter(o => o.payment_status === 'pending');
  const failedOrders = orders.filter(o => o.payment_status === 'failed');
  const totalRevenue = completedOrders.reduce((s, o) => s + Number(o.amount), 0);
  const uniqueCustomers = new Set(orders.map(o => o.customer?.email).filter(Boolean)).size;

  if (loading) {
    return (
      <div className="flex justify-center" style={{ padding: 'var(--space-16)' }}>
        <div className="spinner spinner-lg spinner-gold"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Stats Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-8)',
      }}>
        <div className="stat-card">
          <div className="stat-card-label">Total Revenue</div>
          <div className="stat-card-value" style={{ color: 'var(--color-success)' }}>
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Total Orders</div>
          <div className="stat-card-value">{totalOrders}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Completed</div>
          <div className="stat-card-value" style={{ color: 'var(--color-success)' }}>
            {completedOrders.length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Pending</div>
          <div className="stat-card-value" style={{ color: 'var(--color-warning)' }}>
            {pendingOrders.length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Failed</div>
          <div className="stat-card-value" style={{ color: 'var(--color-error)' }}>
            {failedOrders.length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Customers</div>
          <div className="stat-card-value">{uniqueCustomers}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-6)',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              className="form-input"
              placeholder="Search by name, email, product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: '320px', paddingLeft: '36px' }}
            />
          </div>

          {/* Filter pills */}
          <div style={{
            display: 'flex',
            gap: '4px',
            background: 'var(--color-bg-warm)',
            borderRadius: 'var(--radius-lg)',
            padding: '3px',
          }}>
            {(['all', 'completed', 'pending', 'failed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '6px 14px',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all var(--transition-fast)',
                  background: statusFilter === status ? 'var(--color-bg-card)' : 'transparent',
                  color: statusFilter === status ? 'var(--color-text)' : 'var(--color-text-muted)',
                  boxShadow: statusFilter === status ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-primary" onClick={exportCSV} style={{ gap: 'var(--space-2)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Orders Table */}
      {filteredOrders.length > 0 ? (
        <div className="table-container" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Product</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Gateway</th>
                <th>Status</th>
                <th>Transaction ID</th>
                <th>Date</th>
                <th style={{ textAlign: 'center' }}>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      {/* Avatar */}
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-full)',
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 700,
                        flexShrink: 0,
                        letterSpacing: '0.5px',
                      }}>
                        {(order.customer?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', lineHeight: 1.3 }}>
                          {order.customer?.name || 'Unknown'}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                          {order.customer?.email || ''}
                        </div>
                        {order.customer?.phone && (
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                            {order.customer.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                      {order.product?.name || 'Deleted'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)' }}>
                      {order.currency === 'INR' ? '₹' : '$'}{Number(order.amount).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 10px',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-bg-warm)',
                      color: 'var(--color-text-secondary)',
                      textTransform: 'capitalize',
                    }}>
                      {order.gateway_used}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 10px',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-full)',
                      textTransform: 'capitalize',
                      background:
                        order.payment_status === 'completed' ? 'var(--color-success-bg)' :
                        order.payment_status === 'failed' ? 'var(--color-error-bg)' :
                        order.payment_status === 'refunded' ? 'var(--color-warning-bg)' :
                        'var(--color-warning-bg)',
                      color:
                        order.payment_status === 'completed' ? 'var(--color-success)' :
                        order.payment_status === 'failed' ? 'var(--color-error)' :
                        order.payment_status === 'refunded' ? 'var(--color-warning)' :
                        'var(--color-warning)',
                    }}>
                      {/* Status dot */}
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'currentColor',
                        flexShrink: 0,
                      }} />
                      {order.payment_status}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
                      background: order.transaction_id ? 'var(--color-bg-warm)' : 'transparent',
                      padding: order.transaction_id ? '2px 8px' : '0',
                      borderRadius: 'var(--radius-sm)',
                    }}>
                      {order.transaction_id ? order.transaction_id.slice(0, 16) + (order.transaction_id.length > 16 ? '…' : '') : '—'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      <div style={{ fontWeight: 500 }}>
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div style={{ color: 'var(--color-text-muted)' }}>
                        {new Date(order.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <a
                      href={`/api/admin/orders/${order.id}/invoice`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Download Invoice PDF"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-bg-warm)',
                        color: 'var(--color-primary)',
                        transition: 'all var(--transition-fast)',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-primary)';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.transform = 'scale(1.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--color-bg-warm)';
                        e.currentTarget.style.color = 'var(--color-primary)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ padding: 'var(--space-16)', textAlign: 'center' }}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', opacity: 0.5 }}>
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="2" />
            </svg>
          </div>
          <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>No Orders Found</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            {search || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Orders will appear here once customers make purchases.'}
          </p>
        </div>
      )}

      {/* Footer summary */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 'var(--space-4)',
        padding: 'var(--space-3) 0',
      }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          Showing {filteredOrders.length} of {orders.length} orders
        </span>
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
