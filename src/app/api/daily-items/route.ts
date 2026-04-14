import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createDailyItemSchema } from '@/lib/validations/task';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createDailyItemSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const { daily_plan_id, title, tier, biz, carryover_count, notes } = result.data;

    const newItem = await prisma.dailyItem.create({
      data: {
        daily_plan_id,
        title,
        tier,
        biz,
        status: 'PENDING',
        carryover_count,
        notes,
      },
    });

    return NextResponse.json(newItem);
  } catch (error: any) {
    console.error('Error creating daily item:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
