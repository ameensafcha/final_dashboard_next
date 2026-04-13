import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const isSuperAdmin = process.env.SUPER_ADMIN_EMAIL && user?.email === process.env.SUPER_ADMIN_EMAIL;
    if (!user || !isSuperAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const employees = await prisma.employee.findMany({
      include: { role: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: employees });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    const isSuperAdmin = process.env.SUPER_ADMIN_EMAIL && user?.email === process.env.SUPER_ADMIN_EMAIL;
    if (!user || !isSuperAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { employeeId, roleId } = body;

    if (!employeeId) return NextResponse.json({ error: 'employeeId required' }, { status: 400 });

    if (roleId) {
      const role = await prisma.role.findUnique({ where: { id: roleId } });
      if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: { role_id: roleId || null },
      include: { role: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
