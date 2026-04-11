import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const employee = await prisma.employees.findUnique({
      where: { id: user.id },
      include: {
        role: {
          include: {
            permissions: { where: { is_active: true } }
          }
        }
      }
    });

    if (!employee) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const permissions = employee.role?.permissions.map(p => p.permission) || [];

    return NextResponse.json({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role?.name || null,
      permissions: permissions
    });

  } catch (error) {
    console.error("API_ERROR:", error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}