import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/auth-helper';

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
//
const roles = await prisma.roles.findMany({
  include: {
    permissions: true, // DB se permissions saath mangwayein
  },
  orderBy: { name: 'asc' }
});a

export async function POST(req: Request) {
  try {
    // Only admins should create roles
    const { user, error } = await verifyApiAuth();
    if (error) return error;
    
    if (!user?.isAdmin) {
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