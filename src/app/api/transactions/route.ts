import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [transactions, employees] = await Promise.all([
      prisma.transactions.findMany({
        include: { employee: true },
        orderBy: { date: "desc" },
      }),
      prisma.employee.findMany({
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({ transactions, employees });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { type, amount, person_id, note, date } = body;

    if (!type || !amount) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const transaction = await prisma.transactions.create({
      data: {
        type,
        amount: parseFloat(amount),
        person_id: person_id || null,
        note,
        date: date ? new Date(date) : new Date(),
      },
      include: { employee: true },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
