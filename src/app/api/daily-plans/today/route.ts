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

    // Use a transaction to create the plan and its items
    const newPlan = await prisma.$transaction(async (tx) => {
      const plan = await tx.dailyPlan.create({
        data: {
          employee_id: user.id,
          plan_date: new Date(),
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
      return plan;
    });

    return NextResponse.json(newPlan);
  } catch (error: any) {
    console.error('Error creating daily plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
