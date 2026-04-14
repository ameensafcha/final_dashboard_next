import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { updateDailyItemSchema } from '@/lib/validations/task';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    const result = updateDailyItemSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const { status, notes, blocker_reason, action_owner, title, biz } = result.data;

    // 1. Update the Item
    const updatedItem = await prisma.$transaction(async (tx) => {
      const item = await tx.dailyItem.update({
        where: { id },
        data: {
          status,
          notes,
          blocker_reason,
          action_owner,
          title,
          biz
        },
        include: {
          daily_plan: {
            include: {
              items: true,
            },
          },
        },
      });

      // 2. If blocked, also add to DailyBlocker table for the "What's Blocked?" section
      if (status === 'BLOCKED' && blocker_reason) {
        await tx.dailyBlocker.create({
          data: {
            daily_plan_id: item.daily_plan_id,
            blocker_text: blocker_reason,
            action_owner: action_owner,
          },
        });
      } else if (status && status !== 'BLOCKED') {
        // Item is being unblocked — resolve any open DailyBlocker records
        await tx.dailyBlocker.updateMany({
          where: {
            daily_plan_id: item.daily_plan_id,
            status: 'ACTIVE',
          },
          data: { status: 'RESOLVED' },
        });
      }

      // 3. Recalculate Score: (Completed / Active) * 10 — excludes ARCHIVED items
      const activeItems = item.daily_plan.items.filter(i => i.status !== 'ARCHIVED');
      const totalItems = activeItems.length;
      const completedItems = activeItems.filter(i => i.status === 'COMPLETED').length;
      const newScore = totalItems > 0 ? Math.round((completedItems / totalItems) * 10) : 0;

      await tx.dailyPlan.update({
        where: { id: item.daily_plan_id },
        data: { score: newScore },
      });

      return item;
    });

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error('Error updating daily item:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
