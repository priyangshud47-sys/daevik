import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return new NextResponse('Missing URL', { status: 400 });

  let storagePath = url;
  if (storagePath.includes('/cdn/')) {
     storagePath = storagePath.split('/cdn/product-files/')[1];
  } else {
     const match = storagePath.match(/product-files\/(.+)$/);
     if (match && match[1]) {
         storagePath = decodeURIComponent(match[1].split('?')[0]);
     }
  }

  if (!storagePath) {
    return new NextResponse('Invalid file path', { status: 400 });
  }

  const { data: signedData, error: signedError } = await supabase
    .storage
    .from('product-files')
    .createSignedUrl(storagePath, 60);

  if (signedError || !signedData?.signedUrl) {
    return new NextResponse('Failed to generate secure link', { status: 500 });
  }

  return NextResponse.redirect(signedData.signedUrl);
}
