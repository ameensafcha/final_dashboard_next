import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApi } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const roles = await prisma.role.findMany({
      include: {
        _count: { select: { employees: true } },
        permissions: { 
          where: { is_active: true },
          include: { permission: true }
        }
      }
    });
    return NextResponse.json({ data: roles });
  } catch (err) {
    console.error('Fetch Roles Error:', err);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const body = await req.json();
    const role = await prisma.role.create({
      data: {
        name: body.name,
        description: body.description,
        is_active: true
      }
    });
    return NextResponse.json(role);
  } catch (err) {
    console.error('Create Role Error:', err);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const body = await req.json();
    const { id, name, description } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const role = await prisma.role.update({
      where: { id },
      data: { name, description }
    });
    return NextResponse.json(role);
  } catch (err) {
    console.error('Update Role Error:', err);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await prisma.role.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete Role Error:', err);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
