import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { error } = await verifyApiAuth();
    if (error) return error;

    const perms = await prisma.role_permissions.findMany({
      where: { is_active: true },
      select: { permission: true },
      distinct: ['permission'],
      orderBy: { permission: 'asc' },
    });

    return NextResponse.json(perms.map(p => p.permission));
  } catch (err) {
    console.error('Get Permissions Error:', err);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { error } = await verifyApiAuth();
    if (error) return error;

    const body = await req.json();

    // Individual toggle: { roleId, permission, active }
    if (body.roleId && body.permission !== undefined) {
      const { roleId, permission, active } = body;
      if (active) {
        await prisma.role_permissions.upsert({
          where: { role_id_permission: { role_id: roleId, permission } },
          update: { is_active: true },
          create: { role_id: roleId, permission, is_active: true },
        });
      } else {
        await prisma.role_permissions.deleteMany({
          where: { role_id: roleId, permission },
        });
      }
      return NextResponse.json({ success: true });
    }

    // Bulk sync: { role_id, permissions: string[] }
    const { role_id, permissions } = body;
    if (!role_id || !Array.isArray(permissions)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.role_permissions.deleteMany({ where: { role_id } }),
      prisma.role_permissions.createMany({
        data: permissions.map(p => ({ role_id, permission: p, is_active: true }))
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Permission Sync Error:', err);
    return NextResponse.json({ error: 'Failed to sync permissions' }, { status: 500 });
  }
}
