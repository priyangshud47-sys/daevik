import { supabase } from '@/lib/supabase';
import { getFunnelStats } from '@/lib/funnel';

export const dynamic = 'force-dynamic';

interface Product {
  id: string;
  name: string;
  slug: string;
}

interface ProductFunnel {
  product: Product;
  stats: { page_views: number; checkout_starts: number; purchases: number; abandoned: number };
}

export default async function AnalyticsPage() {
  // Fetch all products
  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug')
    .order('created_at', { ascending: false });

  // Get funnel stats per product
  const productFunnels: ProductFunnel[] = [];
  if (products) {
    for (const product of products) {
      const stats = await getFunnelStats(product.id);
      productFunnels.push({ product, stats });
    }
  }

  // Site-wide funnel
  const siteStats = await getFunnelStats();

  return (
    <div className="animate-fade-in">
      {/* Site-Wide Funnel */}
      <div className="card mb-8">
        <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-6)' }}>
          Site-Wide Funnel
        </h3>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <div className="stat-card-label">Page Views</div>
            <div className="stat-card-value">{siteStats.page_views}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Checkout Started</div>
            <div className="stat-card-value">{siteStats.checkout_starts}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Purchases</div>
            <div className="stat-card-value">{siteStats.purchases}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Abandoned</div>
            <div className="stat-card-value">{siteStats.abandoned}</div>
          </div>
        </div>

        {/* Visual Funnel */}
        <div style={{ maxWidth: '600px' }}>
          {[
            { label: 'Page Views', value: siteStats.page_views, color: 'var(--color-info)' },
            { label: 'Checkout Started', value: siteStats.checkout_starts, color: 'var(--color-secondary)' },
            { label: 'Purchased', value: siteStats.purchases, color: 'var(--color-success)' },
            { label: 'Abandoned', value: siteStats.abandoned, color: 'var(--color-error)' },
          ].map((step, i) => {
            const maxVal = Math.max(siteStats.page_views, 1);
            const widthPercent = Math.max((step.value / maxVal) * 100, 2);
            return (
              <div key={i} style={{ marginBottom: 'var(--space-3)' }}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold">{step.label}</span>
                  <span className="text-sm" style={{ color: step.color, fontWeight: 700 }}>
                    {step.value}
                    {i > 0 && siteStats.page_views > 0 && (
                      <span className="text-xs text-muted" style={{ marginLeft: 'var(--space-2)' }}>
                        ({((step.value / siteStats.page_views) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </span>
                </div>
                <div style={{
                  height: '24px',
                  background: 'var(--color-bg-warm)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${widthPercent}%`,
                      background: step.color,
                      borderRadius: 'var(--radius-sm)',
                      transition: 'width 0.5s ease',
                      opacity: 0.8,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-Product Funnels */}
      <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>
        Per-Product Breakdown
      </h3>

      {productFunnels.length > 0 ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="text-right">Page Views</th>
                <th className="text-right">Checkout</th>
                <th className="text-right">Purchases</th>
                <th className="text-right">Abandoned</th>
                <th className="text-right">Conv. Rate</th>
              </tr>
            </thead>
            <tbody>
              {productFunnels.map(({ product, stats }) => {
                const convRate = stats.page_views > 0
                  ? ((stats.purchases / stats.page_views) * 100).toFixed(1)
                  : '0.0';
                return (
                  <tr key={product.id}>
                    <td className="font-semibold">{product.name}</td>
                    <td className="text-right">{stats.page_views}</td>
                    <td className="text-right">{stats.checkout_starts}</td>
                    <td className="text-right">
                      <span className="font-semibold" style={{ color: 'var(--color-success)' }}>
                        {stats.purchases}
                      </span>
                    </td>
                    <td className="text-right">
                      <span style={{ color: stats.abandoned > 0 ? 'var(--color-error)' : 'inherit' }}>
                        {stats.abandoned}
                      </span>
                    </td>
                    <td className="text-right font-semibold">{convRate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
            <h3>No Analytics Data Yet</h3>
            <p>Funnel data will appear once customers start visiting your product pages.</p>
          </div>
        </div>
      )}
    </div>
  );
}
