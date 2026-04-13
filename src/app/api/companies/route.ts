import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const companySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  is_active: z.boolean().default(true),
});

async function checkIsAdmin(user: any) {
  try {
    if (!user) return false;
    
    // 1. Check Super Admin Email from env
    if (process.env.SUPER_ADMIN_EMAIL && user.email === process.env.SUPER_ADMIN_EMAIL) {
      return true;
    }

    // 2. Check Role from Database
    const employee = await prisma.employee.findUnique({
      where: { id: user.id },
      include: { role: true }
    });

    return employee?.role?.name === "Admin";
  } catch (error) {
    console.error("checkIsAdmin Error:", error);
    return false;
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    const companies = await prisma.companies.findMany({
      where: activeOnly ? { is_active: true } : {},
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: companies });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = await checkIsAdmin(user);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validatedData = companySchema.parse(body);

    if (!prisma.companies) {
      throw new Error("Prisma client property 'companies' is missing. Try restarting the server.");
    }

    const company = await prisma.companies.create({
      data: validatedData,
    });

    return NextResponse.json({ data: company }, { status: 201 });
  } catch (error) {
    console.error("POST Companies Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    // Check for Prisma unique constraint error
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ error: "A company with this name already exists" }, { status: 400 });
    }
    return NextResponse.json({ 
      error: "Failed to create company", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = await checkIsAdmin(user);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const validatedData = companySchema.partial().parse(data);

    const company = await prisma.companies.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({ data: company });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = await checkIsAdmin(user);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    await prisma.companies.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete company. It might be linked to tasks." }, { status: 500 });
  }
}