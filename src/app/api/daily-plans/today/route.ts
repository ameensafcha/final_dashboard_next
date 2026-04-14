import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    // 1. Fetch Today's Plan
    const todayPlan = await prisma.dailyPlan.findFirst({
      where: {
        employee_id: user.id,
        plan_date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: true,
        blockers: true,
      },
    });

    // 2. Fetch pending/blocked items from last 3 days for the builder and dashboard
    const threeDaysAgo = startOfDay(subDays(today, 3));
    const pendingHistory = await prisma.dailyItem.findMany({
      where: {
        daily_plan: {
          employee_id: user.id,
          plan_date: {
            gte: threeDaysAgo,
            lt: start,
          },
        },
        status: {
          in: ['PENDING', 'BLOCKED'],
        },
      },
      include: {
        daily_plan: {
          select: {
            plan_date: true,
          },
        },
      },
      orderBy: {
        daily_plan: {
          plan_date: 'desc',
        },
      },
    });

    if (todayPlan) {
      return NextResponse.json({ plan: todayPlan, pendingHistory });
    }

    return NextResponse.json({
      plan: null,
      pendingHistory
    });

  } catch (error: any) {
    console.error('Error fetching today\'s plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items, tomorrow_notes } = body;

    const today = new Date();
    const yesterday = startOfDay(subDays(today, 1));
    const yesterdayEnd = endOfDay(subDays(today, 1));

    // Use a transaction to create the plan and its items
    const newPlan = await prisma.$transaction(async (tx) => {
      const plan = await tx.dailyPlan.create({
        data: {
          employee_id: user.id,
          plan_date: today,
          tomorrow_notes: tomorrow_notes || [],
          items: {
            create: items.map((item: any) => ({
              title: item.title,
              tier: item.tier,
              biz: item.biz,
              status: item.status || 'PENDING',
              notes: item.notes,
              carryover_count: item.carryover_count || 0,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // Auto-carryover: fetch yesterday's PENDING items
      const previousPending = await tx.dailyItem.findMany({
        where: {
          daily_plan: {
            employee_id: user.id,
            plan_date: { gte: yesterday, lte: yesterdayEnd },
          },
          status: 'PENDING',
        },
      });

      // Deduplicate: skip items the user already explicitly added (match by title)
      const submittedTitles = new Set(items.map((i: any) => i.title.trim().toLowerCase()));
      const toCarryover = previousPending.filter(
        (p) => !submittedTitles.has(p.title.trim().toLowerCase())
      );

      if (toCarryover.length > 0) {
        await tx.dailyItem.createMany({
          data: toCarryover.map((p) => ({
            daily_plan_id: plan.id,
            title: p.title,
            tier: p.tier,
            biz: p.biz,
            status: 'PENDING' as const,
            notes: p.notes,
            carryover_count: p.carryover_count + 1,
          })),
        });
      }

      // Re-fetch plan with all items (including auto-carried-over ones)
      return tx.dailyPlan.findUnique({
        where: { id: plan.id },
        include: { items: true },
      });
    });

    return NextResponse.json(newPlan);
  } catch (error: any) {
    console.error('Error creating daily plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tomorrow_notes } = body;

    if (!Array.isArray(tomorrow_notes)) {
      return NextResponse.json({ error: 'tomorrow_notes must be an array' }, { status: 400 });
    }

    const start = startOfDay(new Date());
    const end = endOfDay(new Date());

    await prisma.dailyPlan.updateMany({
      where: {
        employee_id: user.id,
        plan_date: { gte: start, lte: end },
      },
      data: {
        tomorrow_notes: tomorrow_notes.filter((n: string) => typeof n === 'string' && n.trim() !== ''),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating tomorrow_notes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
