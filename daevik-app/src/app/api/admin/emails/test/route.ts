// Admin Email Test Send API
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendEmail, renderTemplate } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, to } = body;

    if (!templateId || !to) {
      return NextResponse.json({ error: 'Missing templateId or to' }, { status: 400 });
    }

    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Render with sample data
    const sampleData = {
      customer_name: 'Test Customer',
      customer_email: to,
      product_name: 'Sample Product',
      product_price: '₹999',
      download_link: 'https://example.com/download',
      order_id: 'TEST-12345',
    };

    const subject = renderTemplate(template.subject, sampleData);
    const html = renderTemplate(template.body, sampleData);

    const success = await sendEmail({
      to,
      subject: `[TEST] ${subject}`,
      html,
      senderName: template.sender_name,
    });

    return NextResponse.json({ success });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
