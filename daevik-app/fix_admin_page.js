const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/admin/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add lifetime orders query to Promise.all
content = content.replace(
  "supabase.from('orders').select('amount, created_at').eq('payment_status', 'completed').gte('created_at', sevenDaysAgoUtc)\n  ]);",
  "supabase.from('orders').select('amount, created_at').eq('payment_status', 'completed').gte('created_at', sevenDaysAgoUtc),\n    supabase.from('orders').select('amount').eq('payment_status', 'completed')\n  ]);"
);

content = content.replace(
  "    { data: chartOrdersData }\n  ] = await Promise.all([",
  "    { data: chartOrdersData },\n    { data: lifetimeOrdersData }\n  ] = await Promise.all(["
);

// 2. Calculate lifetime stats
content = content.replace(
  "const salesCount = filteredOrders?.length || 0;",
  "const salesCount = filteredOrders?.length || 0;\n  const lifetimeSalesCount = lifetimeOrdersData?.length || 0;\n  const lifetimeRevenue = lifetimeOrdersData?.reduce((sum, o) => sum + Number(o.amount), 0) || 0;"
);

content = content.replace(
  "last7Days,\n  };\n}",
  "last7Days,\n    lifetimeSalesCount,\n    lifetimeRevenue,\n  };\n}"
);

// 3. Add 4th card
const fourthCard = `        <div className="stat-card">
          <div className="stat-card-label">Total Lifetime Sales</div>
          <div className="stat-card-value">₹{data.lifetimeRevenue.toLocaleString('en-IN')}</div>
          <div className="stat-card-change">
            {data.lifetimeSalesCount} total orders
          </div>
        </div>
      </div>`;

content = content.replace(
  "          </div>\n        </div>\n      </div>",
  "          </div>\n        </div>\n\n" + fourthCard
);

fs.writeFileSync(file, content);
console.log("Fixed 4th stat card on admin dashboard");
