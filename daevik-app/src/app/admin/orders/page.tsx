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
    setToast({ message: 'CSV exported!', type: 'success' });
    setTimeout(() => setToast(null), 3000);
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
      {/* Filters */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex gap-3 items-center flex-wrap">
          <input
            type="search"
            className="form-input"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ maxWidth: '160px' }}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <button className="btn btn-secondary" onClick={exportCSV}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Orders Table */}
      {filteredOrders.length > 0 ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Gateway</th>
                <th>Status</th>
                <th>Transaction ID</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <div className="font-semibold">{order.customer?.name || 'Unknown'}</div>
                    <div className="text-xs text-muted">{order.customer?.email || ''}</div>
                    {order.customer?.phone && (
                      <div className="text-xs text-muted">{order.customer.phone}</div>
                    )}
                  </td>
                  <td>{order.product?.name || 'Deleted'}</td>
                  <td className="font-semibold">
                    {order.currency === 'INR' ? '₹' : '$'}{Number(order.amount).toLocaleString('en-IN')}
                  </td>
                  <td>
                    <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                      {order.gateway_used}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      order.payment_status === 'completed' ? 'badge-success' :
                      order.payment_status === 'failed' ? 'badge-error' :
                      order.payment_status === 'refunded' ? 'badge-warning' :
                      'badge-neutral'
                    }`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="text-xs text-muted" style={{ fontFamily: 'monospace' }}>
                    {order.transaction_id || '—'}
                  </td>
                  <td className="text-sm text-muted">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <h3>No Orders Found</h3>
            <p>{search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Orders will appear here once customers make purchases.'}</p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="flex gap-6 mt-6">
        <div className="text-sm text-muted">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
        <div className="text-sm font-semibold">
          Total: {orders.filter(o => o.payment_status === 'completed').length} completed •{' '}
          ₹{orders.filter(o => o.payment_status === 'completed').reduce((s, o) => s + Number(o.amount), 0).toLocaleString('en-IN')} revenue
        </div>
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
