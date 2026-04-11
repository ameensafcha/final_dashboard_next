import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helper';

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { roleId, permission, active } = await req.json();

    if (!roleId || !permission) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // Upsert: Agar permission pehle se hai toh update karo, nahi toh nayi banao
    await prisma.role_permissions.upsert({
      where: {
        role_id_permission: {
          role_id: roleId,
          permission: permission,
        },
      },
      update: { is_active: active },
      create: {
        role_id: roleId,
        permission: permission,
        is_active: active,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Permission Error:', error);
    return NextResponse.json({ error: 'Failed to update permission' }, { status: 500 });
  }
}