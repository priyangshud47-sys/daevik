import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Generate a unique filename using UUID to prevent collisions
    const fileExt = file.name.split('.').pop();
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

    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('product-files')
      .getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl }, { status: 200 });

  } catch (error) {
    console.error('File Upload Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
