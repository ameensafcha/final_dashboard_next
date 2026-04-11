import { NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/auth-helper';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { error } = await verifyApiAuth();
    if (error) return error;

    const employees = await prisma.employees.findMany({
      include: { role: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { error } = await verifyApiAuth();
    if (error) return error;

    const body = await request.json();
    const { employeeId, roleId } = body;

    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId is required' }, { status: 400 });
    }

    // roleId can be null to clear the role
    if (roleId) {
      const role = await prisma.roles.findUnique({ where: { id: roleId } });
      if (!role) {
        return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
      }
    }

    const employee = await prisma.employees.findUnique({ where: { id: employeeId } });
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const updated = await prisma.employees.update({
      where: { id: employeeId },
      data: { role_id: roleId || null },
      include: { role: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating employee role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
