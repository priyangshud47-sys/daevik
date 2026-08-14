'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function DashboardFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentRange = searchParams.get('range') || 'today';
  const currentStart = searchParams.get('start') || '';
  const currentEnd = searchParams.get('end') || '';

  const [range, setRange] = useState(currentRange);
  const [start, setStart] = useState(currentStart);
  const [end, setEnd] = useState(currentEnd);

  useEffect(() => {
    setRange(currentRange);
    setStart(currentStart);
    setEnd(currentEnd);
  }, [currentRange, currentStart, currentEnd]);

  const updateFilter = (newRange: string, newStart?: string, newEnd?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', newRange);
    
    if (newRange === 'custom') {
      if (newStart) params.set('start', newStart);
      if (newEnd) params.set('end', newEnd);
    } else {
      params.delete('start');
      params.delete('end');
    }

    router.push(`/admin?${params.toString()}`);
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setRange(val);
    updateFilter(val, start, end);
  };

  const handleCustomDateChange = (type: 'start' | 'end', val: string) => {
    if (type === 'start') {
      setStart(val);
      updateFilter(range, val, end);
    } else {
      setEnd(val);
      updateFilter(range, start, val);
    }
  };

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="form-group" style={{ marginBottom: 0 }}>
        <select 
          className="form-select" 
          value={range} 
          onChange={handleRangeChange}
          style={{ width: '200px' }}
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {range === 'custom' && (
        <div className="flex items-center gap-2">
          <input 
            type="date" 
            className="form-input" 
            value={start}
            onChange={(e) => handleCustomDateChange('start', e.target.value)}
          />
          <span className="text-muted">to</span>
          <input 
            type="date" 
            className="form-input" 
            value={end}
            onChange={(e) => handleCustomDateChange('end', e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
