'use client';

import { useState } from 'react';

type ChartData = {
  date: string;
  count: number;
  revenue: number;
};

export default function DashboardChart({ data }: { data: ChartData[] }) {
  const [view, setView] = useState<'revenue' | 'orders'>('revenue');

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  const maxOrders = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="card" style={{ gridColumn: 'span 2' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>
          Sales — Last 7 Days
        </h3>
        <div style={{ display: 'flex', gap: '4px', background: 'var(--color-bg-alt)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button 
            className={`btn btn-sm ${view === 'revenue' ? 'btn-primary' : 'btn-ghost'}`} 
            onClick={() => setView('revenue')}
            style={{ minWidth: '80px' }}
          >
            Revenue
          </button>
          <button 
            className={`btn btn-sm ${view === 'orders' ? 'btn-primary' : 'btn-ghost'}`} 
            onClick={() => setView('orders')}
            style={{ minWidth: '80px' }}
          >
            Orders
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-2)', height: '200px' }}>
        {data.map((day, i) => {
          const height = view === 'revenue' 
            ? Math.max((day.revenue / maxRevenue) * 160, 4)
            : Math.max((day.count / maxOrders) * 160, 4);

          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div 
                style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '160px', justifyContent: 'flex-end' }}
                className="group"
              >
                {/* Tooltip */}
                <div 
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: '8px',
                    background: 'var(--color-text)',
                    color: 'var(--color-bg)',
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    pointerEvents: 'none'
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{day.date}</div>
                  <div>Revenue: ₹{day.revenue.toLocaleString('en-IN')}</div>
                  <div>Orders: {day.count}</div>
                  {/* Tooltip Arrow */}
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '5px solid var(--color-text)'
                  }} />
                </div>

                <div
                  style={{
                    width: '100%',
                    maxWidth: '48px',
                    height: `${height}px`,
                    background: (view === 'revenue' ? day.revenue > 0 : day.count > 0)
                      ? 'linear-gradient(180deg, var(--color-secondary) 0%, var(--color-secondary-dark) 100%)'
                      : 'var(--color-border-light)',
                    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                    transition: 'height 0.5s ease',
                  }}
                />
              </div>
              <span className="text-xs text-muted">{day.date}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
