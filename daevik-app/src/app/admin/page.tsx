import { supabase } from '@/lib/supabase';
import { getFunnelStats } from '@/lib/funnel';

export const dynamic = 'force-dynamic';

import DashboardFilter from './DashboardFilter';
import DashboardChart from './DashboardChart';
import DashboardTopProducts from './DashboardTopProducts';
import RecentTransactions from './RecentTransactions';

type DateRange = 'today' | 'yesterday' | '7days' | '30days' | 'lifetime' | 'custom';

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
  let startDateIso: string | undefined = undefined;
  let endDateIso: string | undefined = undefined;
  
  if (range !== 'lifetime') {
    const startDate = new Date(startDateIst.getTime() - istOffset);
    const endDate = new Date(endDateIst.getTime() - istOffset);
    startDateIso = startDate.toISOString();
    endDateIso = endDate.toISOString();
  }

  // Prev Period Calculation
  let prevStartDateIst = new Date(startDateIst);
  let prevEndDateIst = new Date(endDateIst);

  if (range === 'today') {
    prevStartDateIst.setUTCDate(prevStartDateIst.getUTCDate() - 1);
    prevEndDateIst.setUTCDate(prevEndDateIst.getUTCDate() - 1);
  } else if (range === 'yesterday') {
    prevStartDateIst.setUTCDate(prevStartDateIst.getUTCDate() - 1);
    prevEndDateIst.setUTCDate(prevEndDateIst.getUTCDate() - 1);
  } else if (range === '7days') {
    prevStartDateIst.setUTCDate(prevStartDateIst.getUTCDate() - 7);
    prevEndDateIst.setUTCDate(prevEndDateIst.getUTCDate() - 7);
  } else if (range === '30days') {
    prevStartDateIst.setUTCDate(prevStartDateIst.getUTCDate() - 30);
    prevEndDateIst.setUTCDate(prevEndDateIst.getUTCDate() - 30);
  } else if (range === 'custom' && customStart && customEnd) {
    const diffTime = endDateIst.getTime() - startDateIst.getTime();
    prevStartDateIst = new Date(startDateIst.getTime() - diffTime);
    prevEndDateIst = new Date(endDateIst.getTime() - diffTime);
  }

  let prevStartDateIso: string | undefined = undefined;
  let prevEndDateIso: string | undefined = undefined;
  
  if (range !== 'lifetime') {
    const pStartDate = new Date(prevStartDateIst.getTime() - istOffset);
    const pEndDate = new Date(prevEndDateIst.getTime() - istOffset);
    prevStartDateIso = pStartDate.toISOString();
    prevEndDateIso = pEndDate.toISOString();
  }

  let rangeLabel = "Today's";
  if (range === 'yesterday') rangeLabel = "Yesterday's";
  else if (range === '7days') rangeLabel = "Last 7 Days";
  else if (range === '30days') rangeLabel = "Last 30 Days";
  else if (range === 'lifetime') rangeLabel = "Lifetime";
  else if (range === 'custom') rangeLabel = "Custom Range";

  // Calculate the start date for the 7-day chart (6 days ago + today)
  const sevenDaysAgoIst = new Date(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() - 6);
  const sevenDaysAgoUtc = new Date(sevenDaysAgoIst.getTime() - istOffset).toISOString();

  // Prepare queries
  let ordersQuery = supabase.from('orders').select('amount, payment_status');
  let prevOrdersQuery = supabase.from('orders').select('amount, payment_status');
  let customersQuery = supabase.from('customers').select('*', { count: 'exact', head: true });
  let prevCustomersQuery = supabase.from('customers').select('*', { count: 'exact', head: true });
  let recentOrdersQuery = supabase.from('orders').select('*, product:products(name, slug), customer:customers(name, email)').order('created_at', { ascending: false }).limit(10);

  if (startDateIso && endDateIso) {
    ordersQuery = ordersQuery.gte('created_at', startDateIso).lt('created_at', endDateIso);
    customersQuery = customersQuery.gte('created_at', startDateIso).lt('created_at', endDateIso);
    recentOrdersQuery = recentOrdersQuery.gte('created_at', startDateIso).lt('created_at', endDateIso);
  }
  
  if (prevStartDateIso && prevEndDateIso) {
    prevOrdersQuery = prevOrdersQuery.gte('created_at', prevStartDateIso).lt('created_at', prevEndDateIso);
    prevCustomersQuery = prevCustomersQuery.gte('created_at', prevStartDateIso).lt('created_at', prevEndDateIso);
  }

  // Execute all database queries concurrently in a single Promise.all
  const [
    { data: filteredOrders },
    { data: prevOrdersData },
    { count: customerCount },
    { count: prevCustomerCount },
    { data: recentOrders },
    funnelStats,
    prevFunnelStats,
    { data: chartOrdersData },
    { data: lifetimeOrdersData }
  ] = await Promise.all([
    ordersQuery,
    prevOrdersQuery,
    customersQuery,
    prevCustomersQuery,
    recentOrdersQuery,
    getFunnelStats(undefined, startDateIso, endDateIso),
    getFunnelStats(undefined, prevStartDateIso, prevEndDateIso),
    // Last 7 days of sales for the chart (always 7 days regardless of filter)
    supabase.from('orders').select('amount, created_at').eq('payment_status', 'completed').gte('created_at', sevenDaysAgoUtc),
    supabase.from('orders').select('amount').eq('payment_status', 'completed')
  ]);

  const completedOrders = (filteredOrders || []).filter(o => o.payment_status === 'completed');
  const refundedOrders = (filteredOrders || []).filter(o => o.payment_status === 'refunded');
  const prevCompletedOrders = (prevOrdersData || []).filter(o => o.payment_status === 'completed');

  const salesCount = completedOrders.length;
  
  const refundRate = (filteredOrders || []).length > 0 
    ? (refundedOrders.length / (filteredOrders || []).length) * 100 
    : 0;

  const lifetimeSalesCount = lifetimeOrdersData?.length || 0;
  const lifetimeRevenue = lifetimeOrdersData?.reduce((sum, o) => sum + Number(o.amount), 0) || 0;
  const revenue = completedOrders.reduce((sum, o) => sum + Number(o.amount), 0);
  const prevRevenue = prevCompletedOrders.reduce((sum, o) => sum + Number(o.amount), 0);
  
  const revenueChange = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : (revenue > 0 ? 100 : 0);
  const customersChange = (prevCustomerCount || 0) > 0 ? (((customerCount || 0) - (prevCustomerCount || 0)) / (prevCustomerCount || 0)) * 100 : ((customerCount || 0) > 0 ? 100 : 0);
  
  const convRate = funnelStats.page_views > 0 ? (funnelStats.purchases / funnelStats.page_views) * 100 : 0;
  const prevConvRate = prevFunnelStats.page_views > 0 ? (prevFunnelStats.purchases / prevFunnelStats.page_views) * 100 : 0;
  const convRateChange = prevConvRate > 0 ? ((convRate - prevConvRate) / prevConvRate) * 100 : (convRate > 0 ? 100 : 0);

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
    salesCount,
    revenue,
    revenueChange,
    rangeLabel,
    customerCount: customerCount || 0,
    customersChange,
    recentOrders: recentOrders || [],
    funnelStats,
    convRate,
    convRateChange,
    refundRate,
    last7Days,
    lifetimeSalesCount,
    lifetimeRevenue,
    startDateIso,
    endDateIso,
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

  const aov = data.salesCount > 0 ? data.revenue / data.salesCount : 0;

  return (
    <div className="animate-fade-in">
      <DashboardFilter />
      
      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <DashboardChart data={data.last7Days} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
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
          
          <DashboardTopProducts startDateIso={data.startDateIso} endDateIso={data.endDateIso} />
        </div>
      </div>

      <RecentTransactions orders={data.recentOrders as any} rangeLabel={data.rangeLabel} />
    </div>
  );
}
