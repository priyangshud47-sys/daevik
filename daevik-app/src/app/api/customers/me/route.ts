import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const customerId = cookieStore.get('daevik_customer_session')?.value;
    
    if (!customerId) {
      return NextResponse.json({ customer: null });
    }

    const { data: customer, error } = await supabase
      .from('customers')
      .select('name, email, phone')
      .eq('id', customerId)
      .single();

    if (error || !customer) {
      return NextResponse.json({ customer: null });
    }

    return NextResponse.json({ customer });
  } catch (err) {
    console.error('Error fetching customer data:', err);
    return NextResponse.json({ customer: null });
  }
}
