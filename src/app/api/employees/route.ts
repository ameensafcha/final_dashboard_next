import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const employees = await prisma.employee.findMany({
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
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const isSuperAdmin = process.env.SUPER_ADMIN_EMAIL && user?.email === process.env.SUPER_ADMIN_EMAIL;
    
    if (!user || !isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role_id } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Create employee in Prisma using the Auth UUID
    const employee = await prisma.employee.create({
      data: {
        id: authData.user.id,
        name,
        email,
        role_id: role_id || null,
        is_active: true,
      },
      include: { role: true },
    });

    return NextResponse.json({ data: employee }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    const isSuperAdmin = process.env.SUPER_ADMIN_EMAIL && user?.email === process.env.SUPER_ADMIN_EMAIL;
    
    if (!user || !isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, is_active, role_id, name } = body;

    if (!id) return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        ...(is_active !== undefined && { is_active }),
        ...(role_id !== undefined && { role_id: role_id || null }),
        ...(name !== undefined && { name }),
      },
      include: { role: true },
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error('Error updating employee:', error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    const isSuperAdmin = process.env.SUPER_ADMIN_EMAIL && user?.email === process.env.SUPER_ADMIN_EMAIL;
    
    if (!user || !isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, is_active, role_id, name } = body;

    if (!id) return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        ...(is_active !== undefined && { is_active }),
        ...(role_id !== undefined && { role_id: role_id || null }),
        ...(name !== undefined && { name }),
      },
      include: { role: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    const isSuperAdmin = process.env.SUPER_ADMIN_EMAIL && user?.email === process.env.SUPER_ADMIN_EMAIL;
    
    if (!user || !isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });

    await prisma.employee.update({
      where: { id },
      data: { is_active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
