'use client';

import { useState } from 'react';

type Order = {
  id: string;
  amount: number;
  gateway_used: string;
  payment_status: string;
  created_at: string;
  transaction_id: string | null;
  customer: { name: string; email: string; phone?: string } | null;
  product: { name: string; slug: string } | null;
};

export default function RecentTransactions({ orders, rangeLabel }: { orders: Order[], rangeLabel: string }) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>
          {rangeLabel === 'Lifetime' ? 'All Transactions' : 'Recent Transactions'}
        </h3>
        <a href="/admin/orders" className="text-sm font-semibold" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
          View All &rarr;
        </a>
      </div>
      
      {orders.length > 0 ? (
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Gateway</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const customer = order.customer;
                const product = order.product;
                return (
                  <tr 
                    key={order.id} 
                    onClick={() => setSelectedOrder(order)}
                    style={{ cursor: 'pointer' }}
                    className="hover:bg-opacity-50 transition-colors"
                  >
                    <td>
                      <div className="font-semibold">{customer?.name || 'Unknown'}</div>
                      <div className="text-xs text-muted">{customer?.email || ''}</div>
                    </td>
                    <td>{product?.name || 'Deleted Product'}</td>
                    <td className="font-semibold">₹{Number(order.amount).toLocaleString('en-IN')}</td>
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
                    <td className="text-sm text-muted">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
          <h3>No Transactions {rangeLabel === 'Lifetime' ? 'Yet' : 'in This Period'}</h3>
          <p>Orders will appear here once customers make purchases.</p>
        </div>
      )}

      {/* Slide-in Drawer */}
      {selectedOrder && (
        <>
          <div 
            style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40,
              opacity: 1, transition: 'opacity 0.3s'
            }}
            onClick={() => setSelectedOrder(null)}
          />
          <div 
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px', maxWidth: '100vw',
              backgroundColor: 'var(--color-bg)', borderLeft: '1px solid var(--color-border)',
              zIndex: 50, transform: 'translateX(0)', transition: 'transform 0.3s ease-in-out',
              display: 'flex', flexDirection: 'column',
              boxShadow: '-4px 0 15px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="text-lg font-bold">Order Details</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            <div style={{ padding: 'var(--space-4)', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label className="text-xs text-muted font-semibold uppercase tracking-wider block mb-1">Customer</label>
                <div className="font-medium">{selectedOrder.customer?.name || 'N/A'}</div>
                <div className="text-sm">{selectedOrder.customer?.email || 'N/A'}</div>
                {selectedOrder.customer?.phone && <div className="text-sm">{selectedOrder.customer.phone}</div>}
              </div>
              
              <div>
                <label className="text-xs text-muted font-semibold uppercase tracking-wider block mb-1">Product</label>
                <div className="font-medium">{selectedOrder.product?.name || 'N/A'}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <label className="text-xs text-muted font-semibold uppercase tracking-wider block mb-1">Amount</label>
                  <div className="font-medium">₹{Number(selectedOrder.amount).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <label className="text-xs text-muted font-semibold uppercase tracking-wider block mb-1">Status</label>
                  <span className={`badge ${
                    selectedOrder.payment_status === 'completed' ? 'badge-success' :
                    selectedOrder.payment_status === 'failed' ? 'badge-error' :
                    selectedOrder.payment_status === 'refunded' ? 'badge-warning' :
                    'badge-neutral'
                  }`}>
                    {selectedOrder.payment_status}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted font-semibold uppercase tracking-wider block mb-1">Transaction ID</label>
                <div className="font-medium text-sm" style={{ fontFamily: 'monospace' }}>{selectedOrder.transaction_id || 'N/A'}</div>
              </div>

              <div>
                <label className="text-xs text-muted font-semibold uppercase tracking-wider block mb-1">Gateway</label>
                <div className="font-medium" style={{ textTransform: 'capitalize' }}>{selectedOrder.gateway_used}</div>
              </div>
              
              <div>
                <label className="text-xs text-muted font-semibold uppercase tracking-wider block mb-1">Date</label>
                <div className="text-sm">
                  {new Date(selectedOrder.created_at).toLocaleString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
            <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-alt)' }}>
               <a href={`/admin/orders?id=${selectedOrder.id}`} className="btn btn-primary w-full block text-center" style={{ textDecoration: 'none' }}>
                 Manage Order
               </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
