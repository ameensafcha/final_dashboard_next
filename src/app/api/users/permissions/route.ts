import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prisma } = await import('@/lib/prisma');
    
    const employee = await prisma.employees.findUnique({
      where: { id: user.id },
      include: { role: true },
    });

    if (!employee || !employee.role_id) {
      return NextResponse.json({ permissions: [] });
    }

    const rolePermissions = await prisma.role_permissions.findMany({
      where: {
        role_id: employee.role_id,
        is_active: true,
      },
      select: { permission: true },
      orderBy: { permission: 'asc' },
    });

    const permissions = rolePermissions.map(rp => rp.permission);
    
    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('[permissions] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}
