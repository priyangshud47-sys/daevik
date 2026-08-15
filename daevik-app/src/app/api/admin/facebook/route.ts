// Admin Facebook CAPI Config API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { supabase } from '@/lib/supabase';

// GET all Facebook CAPIs
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('fb_capi_config')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// POST create a new Facebook CAPI
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const insertData: Record<string, unknown> = {
      active: true,
    };

    if (body.pixel_id) insertData.pixel_id = body.pixel_id;
    if (body.access_token) insertData.access_token = body.access_token;
    if (body.test_event_code) insertData.test_event_code = body.test_event_code;

    const { data, error } = await supabase
      .from('fb_capi_config')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update an existing Facebook CAPI
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json({ error: 'Config ID required' }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (body.pixel_id !== undefined) update.pixel_id = body.pixel_id;
    if (body.access_token !== undefined) update.access_token = body.access_token;
    if (body.test_event_code !== undefined) update.test_event_code = body.test_event_code;
    if (body.active !== undefined) update.active = body.active;
    
    update.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('fb_capi_config')
      .update(update)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE a Facebook CAPI
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('fb_capi_config')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
