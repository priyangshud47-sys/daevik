import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  
  try {
    const body = await request.json();
    const { payment_status, admin_note } = body;
    
    const updateData: any = {};
    if (payment_status) updateData.payment_status = payment_status;
    if (admin_note !== undefined) updateData.admin_note = admin_note;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Log the activity
    await supabase.from('admin_activity_log').insert({
      action: 'order_updated',
      entity_type: 'order',
      entity_id: id,
      details: updateData
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
