import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPlan = await prisma.dailyPlan.findFirst({
      where: { plan_date: today },
      include: { items: true, blockers: true, tomorrow_notes: true },
    });
    return NextResponse.json(todayPlan);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch today's plan" },
      { status: 500 },
    );
  }
}
