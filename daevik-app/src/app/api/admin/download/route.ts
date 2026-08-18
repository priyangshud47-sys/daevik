import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const type = url.searchParams.get('type');

  if (type === 'orders') {
    const { data, error } = await supabase
      .from('orders')
      .select('id, amount, currency, status, created_at, customer_name, customer_email, customer_phone, payment_provider, utm_source, utm_campaign, admin_note')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const headers = 'ID,Amount,Currency,Status,Created At,Customer Name,Customer Email,Customer Phone,Gateway,Source,Campaign,Notes\n';
    const csv = data.map(row => {
      const escape = (str: string | null) => str ? `"${str.replace(/"/g, '""')}"` : '';
      return [
        row.id,
        row.amount,
        row.currency,
        row.status,
        row.created_at,
        escape(row.customer_name),
        escape(row.customer_email),
        escape(row.customer_phone),
        row.payment_provider,
        escape(row.utm_source),
        escape(row.utm_campaign),
        escape(row.admin_note)
      ].join(',');
    }).join('\n');

    return new NextResponse(headers + csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="daevik_orders.csv"'
      }
    });
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
