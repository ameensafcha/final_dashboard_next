import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { daily_plan_id, title, tier, biz, carryover_count } = body;

    if (!daily_plan_id || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newItem = await prisma.dailyItem.create({
      data: {
        daily_plan_id,
        title,
        tier: tier || 1,
        biz: biz || 'N',
        status: 'PENDING',
        carryover_count: carryover_count || 0,
      },
    });

    return NextResponse.json(newItem);
  } catch (error: any) {
    console.error('Error creating daily item:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
