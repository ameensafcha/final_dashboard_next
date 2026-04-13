import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      const setting = await prisma.app_settings.findUnique({
        where: { key }
      });
      return NextResponse.json({ data: setting });
    }

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
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { key, value } = body;

    if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 });

    const updated = await prisma.app_settings.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}
