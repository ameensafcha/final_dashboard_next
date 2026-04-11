import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApi } from '@/lib/auth-helper';
import { revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const assignments = await prisma.rolePermission.findMany({
      where: { is_active: true },
      include: { permission: true }
    });

    return NextResponse.json({ data: assignments });
  } catch (err) {
    console.error('Get Role-Permissions Error:', err);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const body = await req.json();

    // Individual toggle: { roleId, permissionId, active }
    if (body.roleId && body.permissionId !== undefined) {
      const { roleId, permissionId, active } = body;
      if (active) {
        await prisma.rolePermission.upsert({
          where: { 
            role_id_permission_id: { 
              role_id: roleId, 
              permission_id: permissionId 
            } 
          },
          update: { is_active: true },
          create: { role_id: roleId, permission_id: permissionId, is_active: true },
        });
      } else {
        await prisma.rolePermission.deleteMany({
          where: { role_id: roleId, permission_id: permissionId },
        });
      }
      
      revalidateTag('permissions');
      return NextResponse.json({ success: true });
    }

    // Bulk sync: { role_id, permission_ids: string[] }
    const { role_id, permission_ids } = body;
    if (!role_id || !Array.isArray(permission_ids)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { role_id } }),
      prisma.rolePermission.createMany({
        data: permission_ids.map(pId => ({ role_id, permission_id: pId, is_active: true }))
      })
    ]);

    revalidateTag('permissions');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Permission Sync Error:', err);
    return NextResponse.json({ error: 'Failed to sync permissions' }, { status: 500 });
  }
}
