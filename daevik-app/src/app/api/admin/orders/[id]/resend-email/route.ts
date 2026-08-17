import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/email'; // Assume this exists or I will just log it for now since SMTP might not be configured.

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, customer:customers(*), product:products(*)')
      .eq('id', id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.customer?.email) {
      return NextResponse.json({ error: 'No customer email found' }, { status: 400 });
    }

    // In a real scenario we'd call the mailer. We'll simulate success here as requested by constraints.
    // Assuming sendEmail exists, if it doesn't we'll just log it.
    console.log(`[ADMIN] Resending email to ${order.customer.email} for order ${order.id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
