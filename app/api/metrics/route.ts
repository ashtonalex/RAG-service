import { getMetrics } from '@/lib/metrics';
import { NextResponse } from 'next/server';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('❌ Metrics not available in production', { status: 403 });
  }

  const metrics = getMetrics();
  return NextResponse.json(metrics);
}

