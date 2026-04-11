import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  // Pura user object jisme DB-driven permissions hain
  return NextResponse.json(user);
}