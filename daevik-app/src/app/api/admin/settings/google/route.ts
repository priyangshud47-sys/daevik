import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGoogleTrackingConfig, saveGoogleTrackingConfig } from '@/lib/google-config';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const config = await getGoogleTrackingConfig();
    return NextResponse.json(config);
  } catch (err) {
    console.error('Failed to get Google tracking config:', err);
    return NextResponse.json({ error: 'Failed to load configuration' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const updated = await saveGoogleTrackingConfig(body);
    return NextResponse.json(updated);
  } catch (err) {
    console.error('Failed to save Google tracking config:', err);
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
  }
}
