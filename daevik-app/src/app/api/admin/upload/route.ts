import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Security: Validate file size (e.g. 50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 });
    }

    // Generate a unique filename using UUID to prevent collisions
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    
    // Security: Validate file extension and MIME type
    const allowedExtensions = ['pdf', 'zip', 'rar', 'jpg', 'jpeg', 'png', 'webp'];
    const allowedMimeTypes = [
      'application/pdf',
      'application/zip',
      'application/x-rar-compressed',
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedExtensions.includes(fileExt) || !allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type uploaded. Only PDF, ZIP, RAR, and standard images are allowed.' }, { status: 400 });
    }

    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload to product-files bucket using service role key (bypasses RLS)
    const { data, error } = await supabase
      .storage
      .from('product-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload Error:', error);
      // Return 404 if the bucket doesn't exist
      if (error.message.includes('Bucket not found') || error.message.includes('does not exist')) {
         return NextResponse.json({ error: 'BUCKET_NOT_FOUND' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return internal storage path instead of public URL for privacy
    return NextResponse.json({ url: `product-files/${filePath}` }, { status: 200 });

  } catch (error) {
    console.error('File Upload Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
