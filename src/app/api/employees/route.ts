import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

// GET all employees (full data for admin page + id/name for task form)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const employees = await prisma.employees.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role_id: true,
        is_active: true,
        created_at: true,
        role: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: employees });
  } catch (error) {
    console.error('API_ERROR:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

// PUT — update employee (activate/deactivate, role, name)
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, is_active, role_id, name } = body;

    if (!id) return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });

    const existing = await prisma.employees.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

    const updated = await prisma.employees.update({
      where: { id },
      data: {
        ...(is_active !== undefined && { is_active }),
        ...(role_id !== undefined && { role_id: role_id || null }),
        ...(name !== undefined && { name }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role_id: true,
        is_active: true,
        created_at: true,
        role: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('API_ERROR:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

// DELETE — deactivate employee (soft delete)
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });

    const existing = await prisma.employees.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

    await prisma.employees.update({
      where: { id },
      data: { is_active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API_ERROR:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
