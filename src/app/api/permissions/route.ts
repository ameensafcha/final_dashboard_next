import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApi } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const permissions = await prisma.permission.findMany({
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' }
      ]
    });
    return NextResponse.json({ data: permissions });
  } catch (err) {
    console.error('Fetch Permissions Error:', err);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const body = await req.json();
    const { action, resource, label, description } = body;
    
    if (!action || !resource) {
      return NextResponse.json({ error: 'Action and Resource are required' }, { status: 400 });
    }

    const permission = await prisma.permission.create({
      data: { action, resource, label, description }
    });
    return NextResponse.json(permission);
  } catch (err) {
    console.error('Create Permission Error:', err);
    return NextResponse.json({ error: 'Failed to create permission' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const body = await req.json();
    const { id, action, resource, label, description } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const permission = await prisma.permission.update({
      where: { id },
      data: { action, resource, label, description }
    });
    return NextResponse.json(permission);
  } catch (err) {
    console.error('Update Permission Error:', err);
    return NextResponse.json({ error: 'Failed to update permission' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await prisma.permission.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete Permission Error:', err);
    return NextResponse.json({ error: 'Failed to delete permission' }, { status: 500 });
  }
}
