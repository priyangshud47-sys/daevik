const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/admin/analytics/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add searchParams support
content = content.replace(
  'export default async function AnalyticsPage() {',
  'export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {\n  const resolvedSearchParams = await searchParams;\n  const productFilter = resolvedSearchParams.product || "all";'
);

// 2. Add product filter dropdown UI at the top
const filterUI = `      <div className="flex justify-between items-center mb-6">
        <h2 style={{ fontSize: 'var(--text-xl)' }}>Funnel Analytics</h2>
        <div>
          <form>
            <select 
              name="product" 
              className="form-input" 
              style={{ width: 'auto', display: 'inline-block' }}
              defaultValue={productFilter}
              onChange={(e) => { e.target.form?.submit(); }}
            >
              <option value="all">All Products</option>
              {products?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </form>
        </div>
      </div>`;

content = content.replace(
  '<div className="animate-fade-in">',
  '<div className="animate-fade-in">\n' + filterUI
);

// 3. Filter siteStats based on selected product
content = content.replace(
  'const siteStats = await getFunnelStats();',
  `const siteStats = productFilter !== 'all' ? await getFunnelStats(productFilter) : await getFunnelStats();`
);

// 4. Update clear empty states
content = content.replace(
  '{/* Visual Funnel */}',
  `{/* Visual Funnel */}
        {siteStats.page_views === 0 && (
          <div className="empty-state" style={{ padding: 'var(--space-6)', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-md)' }}>
            <p className="text-muted">No funnel data available for this selection.</p>
          </div>
        )}`
);

// Hide visual funnel elements if 0
content = content.replace(
  /<div key=\{i\} style=\{\{ marginBottom: 'var\(--space-3\)' \}\}>/g,
  '{siteStats.page_views > 0 && <div key={i} style={{ marginBottom: \'var(--space-3)\' }}>'
);
content = content.replace(
  /<\/div>\n\s*\);\n\s*\}\)\}/g,
  '</div>}\n            );\n          })}'
);

fs.writeFileSync(file, content);
console.log("Patched analytics page");
