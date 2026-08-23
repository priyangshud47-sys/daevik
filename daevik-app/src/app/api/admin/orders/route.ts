// Admin Orders API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { supabase } from '@/lib/supabase';

/*
-- MIGRATION REQUIRED
ALTER TABLE orders ADD COLUMN admin_note TEXT;
*/

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const status = searchParams.get('status');
  const productId = searchParams.get('product_id');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  
  const search = searchParams.get('search');
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('orders')
    .select(`
      *,
      product:products(name, slug),
      customer:customers(name, email, phone)
    `, { count: 'exact' });

  if (status) query = query.eq('payment_status', status);
  if (productId) query = query.eq('product_id', productId);
  if (startDate && endDate) {
    query = query.gte('created_at', startDate).lte('created_at', endDate);
  }

  if (search) {
    // 1. Find matching customers first to allow cross-table OR filtering
    const { data: matchedCustomers } = await supabase
      .from('customers')
      .select('id')
      .or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      
    const customerIdList = matchedCustomers?.map(c => c.id).join(',') || '';
    
    // 2. Build the OR condition for orders
    let orQuery = `id::text.ilike.%${search}%,transaction_id.ilike.%${search}%`;
    if (customerIdList) {
      orQuery += `,customer_id.in.(${customerIdList})`;
    }
    
    query = query.or(orQuery);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: data, total: count, page, limit });
}
