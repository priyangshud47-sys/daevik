import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    // 1. Validate the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, product:products(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new NextResponse('Order not found', { status: 404 });
    }

    if (order.payment_status !== 'completed') {
      return new NextResponse('Payment not completed', { status: 403 });
    }

    const customerSession = request.cookies.get('daevik_customer_session')?.value;
    if (!customerSession || customerSession !== order.customer_id) {
      return new NextResponse('Unauthorized request. Session expired or invalid.', { status: 401 });
    }

    if (!order.product || !order.product.product_file_url) {
      return new NextResponse('Product file not found', { status: 404 });
    }

    // 2. Check download limit (Assume column download_count exists, default to 0 if missing)
    const currentCount = order.download_count || 0;
    const MAX_DOWNLOADS = 5;

    if (currentCount >= MAX_DOWNLOADS) {
      return new NextResponse('Download limit reached. Please contact support.', { status: 403 });
    }

    // 3. Extract the storage path
    let storagePath = order.product.product_file_url;
    if (storagePath.includes('/cdn/')) {
       storagePath = storagePath.split('/cdn/product-files/')[1];
    } else {
       const match = storagePath.match(/product-files\/(.+)$/);
       if (match && match[1]) {
           storagePath = decodeURIComponent(match[1].split('?')[0]);
       }
    }

    if (!storagePath) {
      return new NextResponse('Invalid file path', { status: 500 });
    }

    // 4. Generate a 60-second Signed URL
    const { data: signedData, error: signedError } = await supabase
      .storage
      .from('product-files')
      .createSignedUrl(storagePath, 60, {
        download: order.product.name // Forces download with the correct filename
      });

    if (signedError || !signedData?.signedUrl) {
      console.error('Signed URL error:', signedError);
      return new NextResponse('Failed to generate secure link', { status: 500 });
    }

    // 5. Increment download count (this will fail if column doesn't exist yet, but we catch it)
    await supabase
      .from('orders')
      .update({ download_count: currentCount + 1 })
      .eq('id', order.id)
      .select(); // Ignoring error to not break if column is missing during migration

    // 6. Redirect user to the secure signed URL
    return NextResponse.redirect(signedData.signedUrl);

  } catch (error) {
    console.error('Download API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
