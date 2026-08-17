const fs = require('fs');
const path = require('path');

// Fix analytics
const analyticsFile = path.join(__dirname, 'src/app/admin/analytics/page.tsx');
let analyticsContent = fs.readFileSync(analyticsFile, 'utf8');
analyticsContent = analyticsContent.replace(
  'return (\n              {siteStats.page_views > 0 && <div key={i} style={{ marginBottom: \'var(--space-3)\' }}>',
  'return siteStats.page_views > 0 ? (\n              <div key={i} style={{ marginBottom: \'var(--space-3)\' }}>'
);
analyticsContent = analyticsContent.replace(
  '</div>}\n            );\n          })}',
  '</div>\n            ) : null;\n          })}'
);
fs.writeFileSync(analyticsFile, analyticsContent);
console.log('Fixed analytics');

// Fix orders
const ordersFile = path.join(__dirname, 'src/app/admin/orders/page.tsx');
let ordersContent = fs.readFileSync(ordersFile, 'utf8');
// The issue was: <p><strong>Amount:</strong> {selectedOrder.currency === 'INR' ? '₹' : '$'}{Number(selectedOrder.amount).toLocaleString('en-IN')}</p>
// In the replace script, '$' became a backreference or similar because I didn't escape it.
ordersContent = ordersContent.replace(
  /{selectedOrder\.currency === 'INR' \? '₹' : '[\s\S]*?<\/p>/,
  `{selectedOrder.currency === 'INR' ? '₹' : '$'}{Number(selectedOrder.amount).toLocaleString('en-IN')}</p>`
);

fs.writeFileSync(ordersFile, ordersContent);
console.log('Fixed orders');
