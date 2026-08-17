'use client';

import { useRouter } from 'next/navigation';

export default function ProductFilter({ 
  products, 
  defaultValue 
}: { 
  products: { id: string; name: string }[] | null, 
  defaultValue: string 
}) {
  const router = useRouter();

  return (
    <select 
      name="product" 
      className="form-input" 
      style={{ width: 'auto', display: 'inline-block' }}
      defaultValue={defaultValue}
      onChange={(e) => { 
        const url = new URL(window.location.href);
        if (e.target.value === 'all') {
          url.searchParams.delete('product');
        } else {
          url.searchParams.set('product', e.target.value);
        }
        router.push(url.pathname + url.search);
      }}
    >
      <option value="all">All Products</option>
      {products?.map(p => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  );
}
