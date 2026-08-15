import { supabase } from '@/lib/supabase';
import { getFunnelStats } from '@/lib/funnel';

export const dynamic = 'force-dynamic';

import DashboardFilter from './DashboardFilter';

type DateRange = 'today' | 'yesterday' | '7days' | '30days' | 'custom';

async function getDashboardData(range: DateRange, customStart?: string, customEnd?: string) {
  // Calculate dates based on IST (UTC+5:30) for accurate day boundaries in India
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  
  let startDateIst = new Date(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate());
  let endDateIst = new Date(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() + 1);

  if (range === 'yesterday') {
    startDateIst.setUTCDate(startDateIst.getUTCDate() - 1);
    endDateIst.setUTCDate(endDateIst.getUTCDate() - 1);
  } else if (range === '7days') {
    startDateIst.setUTCDate(startDateIst.getUTCDate() - 7);
  } else if (range === '30days') {
    startDateIst.setUTCDate(startDateIst.getUTCDate() - 30);
  } else if (range === 'custom' && customStart && customEnd) {
    startDateIst = new Date(customStart);
    endDateIst = new Date(customEnd);
    endDateIst.setUTCDate(endDateIst.getUTCDate() + 1);
  }

  // Convert the IST day boundaries back to UTC for the database query
  const startDate = new Date(startDateIst.getTime() - istOffset);
  const endDate = new Date(endDateIst.getTime() - istOffset);
  const startDateIso = startDate.toISOString();
  const endDateIso = endDate.toISOString();

  let rangeLabel = "Today's";
  if (range === 'yesterday') rangeLabel = "Yesterday's";
  else if (range === '7days') rangeLabel = "Last 7 Days";
  else if (range === '30days') rangeLabel = "Last 30 Days";
  else if (range === 'custom') rangeLabel = "Custom Date";

  // Calculate the start date for the 7-day chart (6 days ago + today)
  const sevenDaysAgoIst = new Date(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() - 6);
  const sevenDaysAgoUtc = new Date(sevenDaysAgoIst.getTime() - istOffset).toISOString();

  // Execute all database queries concurrently in a single Promise.all
  const [
    { data: filteredOrders },
    { data: allOrders },
    { count: customerCount },
    { data: recentOrders },
    funnelStats,
    { data: chartOrdersData }
  ] = await Promise.all([
    // 1. Filtered sales (current range)
    supabase.from('orders').select('amount').eq('payment_status', 'completed').gte('created_at', startDateIso).lt('created_at', endDateIso),
    // 2. Total sales
    supabase.from('orders').select('amount').eq('payment_status', 'completed'),
    // 3. Total customers
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    // 4. Recent transactions
    supabase.from('orders').select('*, product:products(name, slug), customer:customers(name, email)').gte('created_at', startDateIso).lt('created_at', endDateIso).order('created_at', { ascending: false }).limit(10),
    // 5. Funnel stats
    getFunnelStats(),
    // 6. Last 7 days of sales for the chart (ONE query instead of 7)
    supabase.from('orders').select('amount, created_at').eq('payment_status', 'completed').gte('created_at', sevenDaysAgoUtc)
  ]);

  const filteredSalesCount = filteredOrders?.length || 0;
  const filteredRevenue = filteredOrders?.reduce((sum, o) => sum + Number(o.amount), 0) || 0;
  const totalSalesCount = allOrders?.length || 0;
  const totalRevenue = allOrders?.reduce((sum, o) => sum + Number(o.amount), 0) || 0;

  // Process the 7-day chart data in memory
  const last7Days: { date: string; count: number; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(istNow);
    date.setUTCDate(date.getUTCDate() - i);
    
    // Day boundaries in IST converted back to UTC timestamps
    const dayStartIstObj = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const dayEndIstObj = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1);
    const dayStartTime = dayStartIstObj.getTime() - istOffset;
    const dayEndTime = dayEndIstObj.getTime() - istOffset;

    // Filter the fetched orders for this specific day
    const dayOrders = chartOrdersData?.filter(order => {
      const orderTime = new Date(order.created_at).getTime();
      return orderTime >= dayStartTime && orderTime < dayEndTime;
    }) || [];

    // Format the date label using the IST date
    last7Days.push({
      date: date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', timeZone: 'UTC' }),
      count: dayOrders.length,
      revenue: dayOrders.reduce((sum, o) => sum + Number(o.amount), 0),
    });
  }

  return {
    filteredSalesCount,
    filteredRevenue,
    rangeLabel,
    totalSalesCount,
    totalRevenue,
    customerCount: customerCount || 0,
    recentOrders: recentOrders || [],
    funnelStats,
    last7Days,
  };
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const range = (params.range as DateRange) || 'today';
  
  const data = await getDashboardData(range, params.start, params.end);
  const maxRevenue = Math.max(...data.last7Days.map(d => d.revenue), 1);

  return (
    <div className="animate-fade-in">
      <DashboardFilter />
      
      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="stat-card-label">{data.rangeLabel} Sales</div>
          <div className="stat-card-value">{data.filteredSalesCount}</div>
          <div className="stat-card-change positive">
            ₹{data.filteredRevenue.toLocaleString('en-IN')} revenue
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Total Revenue</div>
          <div className="stat-card-value">₹{data.totalRevenue.toLocaleString('en-IN')}</div>
          <div className="stat-card-change positive">
            {data.totalSalesCount} orders
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Total Customers</div>
          <div className="stat-card-value">{data.customerCount}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Conversion Rate</div>
          <div className="stat-card-value">
            {data.funnelStats.page_views > 0
              ? ((data.funnelStats.purchases / data.funnelStats.page_views) * 100).toFixed(1)
              : '0'}%
          </div>
          <div className="stat-card-change">
            {data.funnelStats.purchases} purchases / {data.funnelStats.page_views} views
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Sales Chart */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--text-lg)' }}>
            Sales — Last 7 Days
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-2)', height: '200px' }}>
            {data.last7Days.map((day, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span className="text-xs font-semibold text-primary">
                  {day.count > 0 ? day.count : ''}
                </span>
                <div
                  style={{
                    width: '100%',
                    maxWidth: '48px',
                    height: `${Math.max((day.revenue / maxRevenue) * 160, 4)}px`,
                    background: day.revenue > 0
                      ? 'linear-gradient(180deg, var(--color-secondary) 0%, var(--color-secondary-dark) 100%)'
                      : 'var(--color-border-light)',
                    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                    transition: 'height 0.5s ease',
                  }}
                />
                <span className="text-xs text-muted">{day.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel Overview */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--text-lg)' }}>
            Funnel Overview
          </h3>
          <div className="funnel">
            {[
              { label: 'Page Views', value: data.funnelStats.page_views, color: 'var(--color-info)' },
              { label: 'Checkout Started', value: data.funnelStats.checkout_starts, color: 'var(--color-secondary)' },
              { label: 'Purchased', value: data.funnelStats.purchases, color: 'var(--color-success)' },
              { label: 'Abandoned', value: data.funnelStats.abandoned, color: 'var(--color-error)' },
            ].map((step, i) => {
              const maxVal = Math.max(data.funnelStats.page_views, 1);
              const width = (step.value / maxVal) * 100;
              return (
                <div key={i} className="funnel-step">
                  <div className="funnel-step-bar" style={{ width: `${width}%`, background: step.color, opacity: 0.15 }} />
                  <span className="funnel-step-label">{step.label}</span>
                  <span className="funnel-step-value" style={{ color: step.color }}>
                    {step.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-lg)' }}>
          Recent Transactions
        </h3>
        {data.recentOrders.length > 0 ? (
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
                {data.recentOrders.map((order) => {
                  const customer = order.customer as { name: string; email: string } | null;
                  const product = order.product as { name: string; slug: string } | null;
                  return (
                    <tr key={order.id}>
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
            <h3>No Transactions Yet</h3>
            <p>Orders will appear here once customers make purchases.</p>
          </div>
        )}
      </div>
    </div>
  );
}
