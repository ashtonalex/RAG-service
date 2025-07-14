import { invalidateCache } from '@/lib/cache';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: 'Missing `key` parameter' }, { status: 400 });
  }

  try {
    await invalidateCache(key);
    return NextResponse.json({ message: `Cache entry "${key}" invalidated.` });
  } catch (error) {
    console.error('❌ Error invalidating cache:', error);
    return NextResponse.json({ error: 'Failed to invalidate cache' }, { status: 500 });
  }
}

