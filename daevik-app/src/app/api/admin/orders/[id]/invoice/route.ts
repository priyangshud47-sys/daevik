import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { generateInvoicePDF } from '@/lib/invoice';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: order } = await supabase
      .from('orders')
      .select('*, product:products(*), customer:customers(*)')
      .eq('id', id)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.customer || !order.product) {
      return NextResponse.json({ error: 'Incomplete order data' }, { status: 400 });
    }

    const invoiceBuffer = await generateInvoicePDF({
      orderId: order.id,
      date: new Date(order.created_at).toLocaleDateString(),
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      productName: order.product.name,
      amount: order.amount,
      currency: order.currency,
      gateway: order.gateway_used || 'Unknown',
      transactionId: order.transaction_id || order.gateway_order_id,
    });

    return new NextResponse(new Uint8Array(invoiceBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${order.id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
