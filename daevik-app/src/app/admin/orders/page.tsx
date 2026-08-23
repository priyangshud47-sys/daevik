'use client';

import { useToast } from '@/components/ToastProvider';
import { useState, useEffect, useCallback, useMemo } from 'react';

interface OrderWithDetails {
  id: string;
  amount: number;
  currency: string;
  gateway_used: string;
  payment_status: string;
  transaction_id: string | null;
  created_at: string;
  admin_note?: string;
  product_id: string;
  product: { id: string; name: string; slug: string } | null;
  customer: { name: string; email: string; phone: string | null } | null;
}

interface UniqueCustomer {
  name: string;
  email: string;
  phone: string | null;
  totalOrders: number;
  completedOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  products: string[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'orders' | 'customers'>('orders');
  const [customerSearch, setCustomerSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { showToast } = useToast();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const limit = 50;
  const [products, setProducts] = useState<{id: string, name: string}[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [updatingOrder, setUpdatingOrder] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (selectedProductId) params.set('product_id', selectedProductId);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate + 'T23:59:59');
      if (debouncedSearch) params.set('search', debouncedSearch);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setTotalOrders(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, selectedProductId, startDate, endDate, debouncedSearch]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/admin/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(data.map((p: any) => ({id: p.id, name: p.name})));
        }
      } catch (err) {}
    };
    fetchProducts();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const sq = search.toLowerCase();
    const matchesSearch =
      !search ||
      order.customer?.name.toLowerCase().includes(sq) ||
      order.customer?.email.toLowerCase().includes(sq) ||
      order.product?.name.toLowerCase().includes(sq) ||
      (order.transaction_id && order.transaction_id.toLowerCase().includes(sq)) ||
      (order.customer?.phone && order.customer.phone.toLowerCase().includes(sq)) ||
      order.id.toLowerCase().includes(sq);

    return matchesSearch;
  });

  // Build unique customers
  const uniqueCustomers = useMemo(() => {
    const map = new Map<string, UniqueCustomer>();
    for (const order of orders) {
      if (!order.customer?.email) continue;
      const key = order.customer.email;
      const existing = map.get(key);
      if (existing) {
        existing.totalOrders += 1;
        if (order.payment_status === 'completed') {
          existing.completedOrders += 1;
          existing.totalSpent += Number(order.amount);
        }
        if (new Date(order.created_at) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.created_at;
        }
        if (order.product?.name && !existing.products.includes(order.product.name)) {
          existing.products.push(order.product.name);
        }
      } else {
        map.set(key, {
          name: order.customer.name,
          email: order.customer.email,
          phone: order.customer.phone,
          totalOrders: 1,
          completedOrders: order.payment_status === 'completed' ? 1 : 0,
          totalSpent: order.payment_status === 'completed' ? Number(order.amount) : 0,
          lastOrderDate: order.created_at,
          products: order.product?.name ? [order.product.name] : [],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
    );
  }, [orders]);

  const filteredCustomers = uniqueCustomers.filter((c) => {
    if (!customerSearch) return true;
    const q = customerSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      c.products.some(p => p.toLowerCase().includes(q))
    );
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
    showToast('CSV exported successfully!', 'success');
    
  };

  const exportCustomersCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Total Orders', 'Completed Orders', 'Total Spent', 'Products', 'Last Order'];
    const rows = filteredCustomers.map((c) => [
      c.name,
      c.email,
      c.phone || '',
      c.totalOrders,
      c.completedOrders,
      c.totalSpent,
      c.products.join('; '),
      new Date(c.lastOrderDate).toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daevik-customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Customers CSV exported!', 'success');
    
  };

  // Stats
  // totalOrders is managed by state for pagination
  const completedOrders = orders.filter(o => o.payment_status === 'completed');
  const pendingOrders = orders.filter(o => o.payment_status === 'pending');
  const failedOrders = orders.filter(o => o.payment_status === 'failed');
  const totalRevenue = completedOrders.reduce((s, o) => s + Number(o.amount), 0);
  
  const gatewayBreakdown = completedOrders.reduce((acc, o) => {
    const gw = o.gateway_used || 'Unknown';
    acc[gw] = (acc[gw] || 0) + Number(o.amount);
    return acc;
  }, {} as Record<string, number>);

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
          <div className="stat-card-label">Unique Customers</div>
          <div className="stat-card-value">{uniqueCustomers.length}</div>
        </div>
      </div>
      
      <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
        <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>Revenue by Gateway</h3>
        <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
          {Object.entries(gatewayBreakdown).map(([gw, rev]) => (
            <div key={gw} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ 
                width: '12px', height: '12px', borderRadius: '50%', 
                background: gw === 'razorpay' ? '#3385ff' : gw === 'payu' ? '#00b14f' : gw === 'paypal' ? '#003087' : 'var(--color-secondary)' 
              }}></span>
              <span style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: 'var(--text-sm)' }}>{gw}:</span>
              <span style={{ fontSize: 'var(--text-sm)' }}>₹{rev.toLocaleString('en-IN')}</span>
            </div>
          ))}
          {Object.keys(gatewayBreakdown).length === 0 && (
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>No completed orders in this view.</span>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{
        display: 'flex',
        gap: '0',
        borderBottom: '2px solid var(--color-border-light)',
        marginBottom: 'var(--space-6)',
      }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '12px 24px',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'orders' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            borderBottom: activeTab === 'orders' ? '2px solid var(--color-primary)' : '2px solid transparent',
            marginBottom: '-2px',
            transition: 'all var(--transition-fast)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="2" />
          </svg>
          Orders
          <span style={{
            background: 'var(--color-bg-warm)',
            color: 'var(--color-text-secondary)',
            padding: '1px 8px',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
          }}>{totalOrders}</span>
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          style={{
            padding: '12px 24px',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'customers' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            borderBottom: activeTab === 'customers' ? '2px solid var(--color-primary)' : '2px solid transparent',
            marginBottom: '-2px',
            transition: 'all var(--transition-fast)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
          Customers
          <span style={{
            background: 'var(--color-bg-warm)',
            color: 'var(--color-text-secondary)',
            padding: '1px 8px',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
          }}>{uniqueCustomers.length}</span>
        </button>
      </div>

      {/* ===================== ORDERS TAB ===================== */}
      {activeTab === 'orders' && (
        <>
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

{/* Date Range Filter */}
              <select 
                className="form-input" 
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                style={{ padding: '6px 12px', fontSize: 'var(--text-xs)', maxWidth: '150px' }}
              >
                <option value="">All Products</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                />
                <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)' }}>-</span>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}
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
                    <tr key={order.id} onClick={() => { setSelectedOrder(order); setAdminNote(order.admin_note || ''); }} style={{ cursor: "pointer" }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
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
                          onClick={(e) => e.stopPropagation()}
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
              Showing {filteredOrders.length} of {totalOrders} orders
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button 
                className="btn btn-sm btn-ghost" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span style={{ fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center' }}>
                Page {page} of {Math.ceil(totalOrders / limit) || 1}
              </span>
              <button 
                className="btn btn-sm btn-ghost" 
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(totalOrders / limit)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* ===================== CUSTOMERS TAB ===================== */}
      {activeTab === 'customers' && (
        <>
          {/* Toolbar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
            flexWrap: 'wrap',
          }}>
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
                placeholder="Search customers..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                style={{ maxWidth: '320px', paddingLeft: '36px' }}
              />
            </div>

            <button className="btn btn-primary" onClick={exportCustomersCSV} style={{ gap: 'var(--space-2)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export Customers
            </button>
          </div>

          {/* Customers Table */}
          {filteredCustomers.length > 0 ? (
            <div className="table-container" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th style={{ textAlign: 'center' }}>Orders</th>
                    <th style={{ textAlign: 'right' }}>Total Spent</th>
                    <th>Products Purchased</th>
                    <th>Last Order</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.email}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--radius-full)',
                            background: 'linear-gradient(135deg, var(--color-secondary-dark), var(--color-secondary))',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 700,
                            flexShrink: 0,
                            letterSpacing: '0.5px',
                          }}>
                            {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', lineHeight: 1.3 }}>
                              {customer.name}
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                              {customer.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                          {customer.phone || '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                            {customer.totalOrders}
                          </span>
                          {customer.completedOrders > 0 && (
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}>
                              {customer.completedOrders} paid
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: 'var(--text-sm)',
                          color: customer.totalSpent > 0 ? 'var(--color-success)' : 'var(--color-text-muted)',
                        }}>
                          ₹{customer.totalSpent.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '250px' }}>
                          {customer.products.map((product) => (
                            <span key={product} style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              fontSize: 'var(--text-xs)',
                              fontWeight: 500,
                              borderRadius: 'var(--radius-full)',
                              background: 'var(--color-bg-warm)',
                              color: 'var(--color-text-secondary)',
                              whiteSpace: 'nowrap',
                            }}>
                              {product.length > 25 ? product.slice(0, 25) + '…' : product}
                            </span>
                          ))}
                          {customer.products.length === 0 && (
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>—</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                          <div style={{ fontWeight: 500 }}>
                            {new Date(customer.lastOrderDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          <div style={{ color: 'var(--color-text-muted)' }}>
                            {new Date(customer.lastOrderDate).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
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
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>No Customers Found</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                {customerSearch ? 'Try adjusting your search.' : 'Customers will appear here once orders are placed.'}
              </p>
            </div>
          )}

          {/* Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'var(--space-4)',
            padding: 'var(--space-3) 0',
          }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              Showing {filteredCustomers.length} of {uniqueCustomers.length} customers
            </span>
          </div>
        </>
      )}

      {/* Order Details Modal/Drawer */}
      {selectedOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', justifyContent: 'flex-end'
        }} onClick={() => { setSelectedOrder(null); setAdminNote(''); }}>
          <div 
            className="animate-slide-left"
            style={{
              width: '100%', maxWidth: '500px', height: '100%',
              backgroundColor: 'var(--color-bg-card)', padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-2xl)', overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--text-xl)' }}>Order Details</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
            
            {selectedOrder.payment_status === 'completed' && (
               <div style={{ marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)' }}>
                 <button
                   className="btn btn-sm btn-secondary text-red-500"
                   onClick={async () => {
                     if (!confirm('Are you sure you want to mark this order as refunded?')) return;
                     setUpdatingOrder(true);
                     try {
                       const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
                         method: 'PUT',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({ payment_status: 'refunded' })
                       });
                       if (res.ok) {
                         showToast('Order refunded', 'success');
                         fetchOrders();
                         setSelectedOrder(null);
                       }
                     } catch (e) {} finally { setUpdatingOrder(false); }
                   }}
                   disabled={updatingOrder}
                 >
                   Refund Order
                 </button>
               </div>
            )}

            
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>Customer</h3>
              <p><strong>Name:</strong> {selectedOrder.customer?.name}</p>
              <p>
                <strong>Email:</strong> {selectedOrder.customer?.email}
                <button 
                  className="btn btn-sm" style={{ marginLeft: 'var(--space-2)', padding: '2px 6px', fontSize: '10px' }}
                  onClick={() => {
                    navigator.clipboard.writeText(selectedOrder.customer?.email || '');
                    showToast('Email copied!', 'success');
                    
                  }}
                >Copy</button>
              </p>
              <p><strong>Phone:</strong> {selectedOrder.customer?.phone || 'N/A'}</p>
            </div>

            <div style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>Product</h3>
              <p><strong>Name:</strong> {selectedOrder.product?.name || 'Unknown'}</p>
              <p><strong>Amount:</strong> {selectedOrder.currency === 'INR' ? '₹' : '$'}{Number(selectedOrder.amount).toLocaleString('en-IN')}</p>
            </div>            <div style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>Transaction</h3>
              <p><strong>Status:</strong> {selectedOrder.payment_status}</p>
              <p><strong>Gateway:</strong> {selectedOrder.gateway_used}</p>
              <p><strong>Transaction ID:</strong> {selectedOrder.transaction_id || 'N/A'}</p>
              <p><strong>Date:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
            </div>
            
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>Admin Note</h3>
              <textarea
                className="form-input"
                style={{ width: '100%', minHeight: '80px', padding: '10px' }}
                value={adminNote !== '' ? adminNote : (selectedOrder.admin_note || '')}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add private note about this order..."
              />
              <button
                className="btn btn-sm btn-primary mt-2"
                onClick={async () => {
                  setUpdatingOrder(true);
                  try {
                    const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ admin_note: adminNote })
                    });
                    if (res.ok) {
                      showToast('Note saved', 'success');
                      fetchOrders();
                    }
                  } catch (e) {} finally { setUpdatingOrder(false); }
                }}
                disabled={updatingOrder}
              >
                Save Note
              </button>
            </div>


            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-8)' }}>
              <button 
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/admin/orders/${selectedOrder.id}/resend-email`, { method: 'POST' });
                    if (res.ok) {
                      showToast('Delivery email resent successfully!', 'success');
                    } else {
                      const data = await res.json().catch(() => ({}));
                      showToast(data.error || 'Failed to resend email', 'error');
                    }
                  } catch (e: any) {
                    showToast(e?.message || 'Failed to resend email', 'error');
                  }
                  
                }}
              >
                Resend Delivery Email
              </button>
              <a 
                href={`/api/admin/orders/${selectedOrder.id}/invoice`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                Download Invoice
              </a>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
}
