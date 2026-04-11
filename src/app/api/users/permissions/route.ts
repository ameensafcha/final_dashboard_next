import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // getCurrentUser now returns permissions as a string array: ["resource:action", ...]
    return NextResponse.json({ 
      permissions: user.permissions || [] 
    });
  } catch (error) {
    console.error('[permissions] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}
