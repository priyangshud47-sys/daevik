import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    if (!body.host || !body.username || !body.password) {
       return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify SMTP connection using nodemailer
    const transporter = nodemailer.createTransport({
      host: body.host,
      port: Number(body.port),
      secure: body.secure,
      auth: {
        user: body.username,
        pass: body.password,
      },
    });

    try {
      await transporter.verify();
      return NextResponse.json({ success: true });
    } catch (verifyError: any) {
      console.error('[SMTP TEST ERROR]', verifyError);
      return NextResponse.json({ error: verifyError.message || 'SMTP Connection Failed' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to verify SMTP connection' }, { status: 500 });
  }
}
