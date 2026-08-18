import { supabase } from '@/lib/supabase';

type TopProduct = {
  name: string;
  slug: string;
  units: number;
  revenue: number;
};

export default async function DashboardTopProducts({ 
  startDateIso, 
  endDateIso 
}: { 
  startDateIso?: string, 
  endDateIso?: string 
}) {
  let query = supabase
    .from('orders')
    .select('amount, product:products(name, slug)')
    .eq('payment_status', 'completed');

  if (startDateIso && endDateIso) {
    query = query.gte('created_at', startDateIso).lt('created_at', endDateIso);
  }

  const { data: orders } = await query;

  const productStats: Record<string, TopProduct> = {};

  if (orders) {
    orders.forEach(order => {
      let product = order.product as unknown as { name: string; slug: string } | { name: string; slug: string }[] | null;
      if (Array.isArray(product)) product = product[0];
      if (!product) return;
      
      if (!productStats[product.slug]) {
        productStats[product.slug] = {
          name: product.name,
          slug: product.slug,
          units: 0,
          revenue: 0
        };
      }
      productStats[product.slug].units += 1;
      productStats[product.slug].revenue += Number(order.amount);
    });
  }

  const topProducts = Object.values(productStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div className="card">
      <h3 style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--text-lg)' }}>
        Top Products
      </h3>
      {topProducts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {topProducts.map((p, i) => (
            <div key={p.slug} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  background: 'var(--color-bg-warm)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: 'var(--color-text-muted)'
                }}>
                  {i + 1}
                </div>
                <div>
                  <div className="font-semibold text-sm">{p.name}</div>
                  <div className="text-xs text-muted">{p.units} units sold</div>
                </div>
              </div>
              <div className="font-semibold text-sm">₹{p.revenue.toLocaleString('en-IN')}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state text-sm" style={{ padding: 'var(--space-4)' }}>
          <p>No products sold in this period.</p>
        </div>
      )}
    </div>
  );
}
