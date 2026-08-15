import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('smtp_configs')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
      throw error;
    }

    return NextResponse.json(data || null);
  } catch (error: any) {
    console.error('Failed to fetch SMTP config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // Check if a config already exists
    const { data: existing } = await supabase
      .from('smtp_configs')
      .select('id')
      .limit(1)
      .single();

    let result;
    if (existing) {
      result = await supabase
        .from('smtp_configs')
        .update({
          host: body.host,
          port: parseInt(body.port),
          secure: body.secure,
          username: body.username,
          password: body.password,
          from_email: body.from_email,
          from_name: body.from_name,
          active: body.active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('smtp_configs')
        .insert({
          host: body.host,
          port: parseInt(body.port),
          secure: body.secure,
          username: body.username,
          password: body.password,
          from_email: body.from_email,
          from_name: body.from_name,
          active: body.active,
        })
        .select()
        .single();
    }

    if (result.error) throw result.error;

    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('Failed to update SMTP config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
