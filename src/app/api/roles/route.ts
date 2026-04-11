import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyApiAuth, requirePermissionApi } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if user is logged in
    const { error } = await verifyApiAuth();
    if (error) return error;

    const roles = await prisma.roles.findMany({
      include: {
        _count: { select: { employees: true } }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(roles);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
export async function POST(req: Request) {
  try {
    // Check specific permission for role management
    const permCheck = await requirePermissionApi('manage:roles');
    if ('error' in permCheck) return permCheck;

    const { user, error } = await verifyApiAuth();
    if (error) return error;

    // Keep role-based check as fallback
    if (!user?.role || user.role.toLowerCase() !== "admin") {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description } = body;

    const role = await prisma.roles.create({
      data: { name, description }
    });

    return NextResponse.json(role);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { user, error } = await verifyApiAuth();
    if (error) return error;
    
    if (!user?.role || user.role.toLowerCase() !== "admin") {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, description } = body;

    const existing = await prisma.roles.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const role = await prisma.roles.update({
      where: { id },
      data: { name, description }
    });

    return NextResponse.json(role);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { user, error } = await verifyApiAuth();
    if (error) return error;
    
    if (!user?.role || user.role.toLowerCase() !== "admin") {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Role ID required' }, { status: 400 });
    }

    const existing = await prisma.roles.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Soft delete: set employees' role_id to null first
    await prisma.employees.updateMany({
      where: { role_id: id },
      data: { role_id: null }
    });

    // Then delete the role
    await prisma.roles.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}