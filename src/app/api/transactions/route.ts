import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authResponse } from "@/lib/auth-helper";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return authResponse("Unauthorized");
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const type = searchParams.get("type");

    const skip = (page - 1) * limit;

    const where = type ? { type } : {};

    const [transactions, total] = await Promise.all([
      prisma.transactions.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.transactions.count({ where }),
    ]);

    return NextResponse.json({
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return authResponse("Unauthorized");
    }

    const body = await request.json();
    const { type, amount, date, reference_id, person, note } = body;

    if (!type || !amount) {
      return NextResponse.json({ error: "Type and amount are required" }, { status: 400 });
    }

    if (!["sale", "purchase"].includes(type)) {
      return NextResponse.json({ error: "Type must be 'sale' or 'purchase'" }, { status: 400 });
    }

    const transaction = await prisma.transactions.create({
      data: {
        type,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        reference_id: reference_id || null,
        person: person || null,
        note: note || null,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return authResponse("Unauthorized");

    const body = await request.json();
    const { id, type, amount, date, reference_id, person, note } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const existing = await prisma.transactions.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const updated = await prisma.transactions.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(date && { date: new Date(date) }),
        ...(reference_id !== undefined && { reference_id }),
        ...(person !== undefined && { person }),
        ...(note !== undefined && { note }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return authResponse("Unauthorized");

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.transactions.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
