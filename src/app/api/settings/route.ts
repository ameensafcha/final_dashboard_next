import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const settingsList = await prisma.app_settings.findMany();
    const settings = settingsList.reduce((acc, curr) => ({
      ...acc,
      [curr.key]: curr.value
    }), {});

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const isSuperAdmin = process.env.SUPER_ADMIN_EMAIL && user?.email === process.env.SUPER_ADMIN_EMAIL;
    if (!user || !isSuperAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { key, value } = body;

    if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 });

    const updated = await prisma.app_settings.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
