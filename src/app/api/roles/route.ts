import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { error } = await verifyApiAuth();
    if (error) return error;

    const roles = await prisma.roles.findMany({
      include: {
        _count: { select: { employees: true } },
        permissions: { where: { is_active: true } }
      }
    });
    return NextResponse.json({ data: roles });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { error } = await verifyApiAuth();
    if (error) return error;

    const body = await req.json();
    const role = await prisma.roles.create({
      data: {
        name: body.name,
        description: body.description,
        is_active: true
      }
    });
    return NextResponse.json(role);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { error } = await verifyApiAuth();
    if (error) return error;

    const body = await req.json();
    const { id, name, description } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const role = await prisma.roles.update({
      where: { id },
      data: { name, description }
    });
    return NextResponse.json(role);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { error } = await verifyApiAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await prisma.roles.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
