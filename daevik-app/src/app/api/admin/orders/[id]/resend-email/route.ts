import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { sendProductDeliveryEmail } from '@/lib/email';
import { generateInvoicePDF } from '@/lib/invoice';

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

    let invoicePdf;
    try {
      const invoiceBuffer = await generateInvoicePDF({
        orderId: order.id,
        date: new Date(order.created_at).toLocaleDateString(),
        customerName: order.customer.name,
        customerEmail: order.customer.email,
        customerPhone: order.customer.phone || '',
        productName: order.product.name,
        amount: order.amount,
        currency: order.currency || 'INR',
        gateway: order.gateway_used || 'Unknown',
        transactionId: order.gateway_order_id || order.id,
      });
      invoicePdf = { filename: `Invoice-${order.id.slice(0, 8)}.pdf`, content: invoiceBuffer };
    } catch (err) {
      console.error('Failed to generate invoice PDF for resend:', err);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://daevik.in';

    try {
      await sendProductDeliveryEmail({
        customerName: order.customer.name,
        customerEmail: order.customer.email,
        productName: order.product.name,
        productPrice: `₹${order.amount}`,
        downloadLink: `${appUrl}/thank-you/${order.product.slug}?orderId=${order.id}`,
        orderId: order.id,
        productId: order.product.id,
        invoicePdf,
      });
    } catch (sendError: any) {
      return NextResponse.json({ error: sendError.message || 'Failed to send email.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Resend email error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
