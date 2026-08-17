const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/admin/orders/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add states for date range and selected order
if (!content.includes('const [startDate, setStartDate] = useState<string>(\'\')')) {
  content = content.replace(
    'const [toast, setToast] = useState<{ message: string; type: \'success\' | \'error\' } | null>(null);',
    'const [toast, setToast] = useState<{ message: string; type: \'success\' | \'error\' } | null>(null);\n  const [startDate, setStartDate] = useState<string>(\'\');\n  const [endDate, setEndDate] = useState<string>(\'\');\n  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);'
  );
}

// 2. Add date filtering to filteredOrders
content = content.replace(
  'const matchesStatus = statusFilter === \'all\' || order.payment_status === statusFilter;',
  `const matchesStatus = statusFilter === 'all' || order.payment_status === statusFilter;
    const matchesStartDate = !startDate || new Date(order.created_at) >= new Date(startDate);
    const matchesEndDate = !endDate || new Date(order.created_at) <= new Date(endDate + 'T23:59:59');`
);
content = content.replace(
  'return matchesSearch && matchesStatus;',
  'return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;'
);

// 3. Add UI inputs for Date Range
const dateRangeUI = `{/* Date Range Filter */}
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
              </div>`;

content = content.replace(
  '              {/* Filter pills */}',
  dateRangeUI + '\n\n              {/* Filter pills */}'
);

// 4. Update the table rows to be clickable and open selectedOrder
content = content.replace(
  '<tr key={order.id}>',
  '<tr key={order.id} onClick={() => setSelectedOrder(order)} style={{ cursor: "pointer" }}>'
);
// Stop invoice button click from bubbling
content = content.replace(
  'title="Download Invoice PDF"',
  'title="Download Invoice PDF"\n                          onClick={(e) => e.stopPropagation()}'
);

// 5. Add Order Details Drawer
const orderDrawer = `{/* Order Details Modal/Drawer */}
      {selectedOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', justifyContent: 'flex-end'
        }} onClick={() => setSelectedOrder(null)}>
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
            
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>Customer</h3>
              <p><strong>Name:</strong> {selectedOrder.customer?.name}</p>
              <p>
                <strong>Email:</strong> {selectedOrder.customer?.email}
                <button 
                  className="btn btn-sm" style={{ marginLeft: 'var(--space-2)', padding: '2px 6px', fontSize: '10px' }}
                  onClick={() => {
                    navigator.clipboard.writeText(selectedOrder.customer?.email || '');
                    setToast({ message: 'Email copied!', type: 'success' });
                    setTimeout(() => setToast(null), 2000);
                  }}
                >Copy</button>
              </p>
              <p><strong>Phone:</strong> {selectedOrder.customer?.phone || 'N/A'}</p>
            </div>

            <div style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>Product</h3>
              <p><strong>Name:</strong> {selectedOrder.product?.name || 'Unknown'}</p>
              <p><strong>Amount:</strong> {selectedOrder.currency === 'INR' ? '₹' : '$'}{Number(selectedOrder.amount).toLocaleString('en-IN')}</p>
            </div>

            <div style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>Transaction</h3>
              <p><strong>Status:</strong> {selectedOrder.payment_status}</p>
              <p><strong>Gateway:</strong> {selectedOrder.gateway_used}</p>
              <p><strong>Transaction ID:</strong> {selectedOrder.transaction_id || 'N/A'}</p>
              <p><strong>Date:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-8)' }}>
              <button 
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    const res = await fetch(\`/api/admin/orders/\${selectedOrder.id}/resend-email\`, { method: 'POST' });
                    if (res.ok) {
                      setToast({ message: 'Delivery email resent successfully!', type: 'success' });
                    } else {
                      setToast({ message: 'Failed to resend email', type: 'error' });
                    }
                  } catch (e) {
                    setToast({ message: 'Failed to resend email', type: 'error' });
                  }
                  setTimeout(() => setToast(null), 3000);
                }}
              >
                Resend Delivery Email
              </button>
              <a 
                href={\`/api/admin/orders/\${selectedOrder.id}/invoice\`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                Download Invoice
              </a>
            </div>
          </div>
        </div>
      )}`;

content = content.replace(
  '{toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}',
  orderDrawer + '\n\n      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}'
);

fs.writeFileSync(file, content);
console.log("Patched orders page");
