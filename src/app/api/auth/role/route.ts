import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helper';
import { prisma } from '@/lib/prisma';

/**
 * Role Management API
 * 
 * Endpoints for managing employee roles.
 * - GET: List all employees with their roles (admin only)
 * - PATCH: Update an employee's role (admin only)
 */

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/role
 * Returns all employees with their role information.
 * Requires admin authorization.
 */
export async function GET() {
  try {
    await requireAdmin();

    const employees = await prisma.employees.findMany({
      include: {
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(employees);
  } catch (error) {
    // Handle redirect from requireAdmin
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

/**
 * PATCH /api/auth/role
 * Updates an employee's role.
 * Requires admin authorization.
 * 
 * Request body:
 * {
 *   employeeId: string,  // ID of the employee to update
 *   roleId: string       // ID of the new role
 * }
 */
export async function PATCH(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { employeeId, roleId } = body;

    // Validate required fields
    if (!employeeId || !roleId) {
      return NextResponse.json(
        { error: 'Missing required fields: employeeId and roleId are required' },
        { status: 400 }
      );
    }

    // Verify the role exists
    const role = await prisma.roles.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      );
    }

    // Verify the employee exists
    const employee = await prisma.employees.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Update the employee's role
    const updated = await prisma.employees.update({
      where: { id: employeeId },
      data: { role_id: roleId },
      include: {
        role: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    // Handle redirect from requireAdmin
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error updating employee role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
