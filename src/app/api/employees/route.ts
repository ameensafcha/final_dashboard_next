import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin, supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const employee = await prisma.employees.findUnique({
      where: { id: user.id },
      include: { role: true },
    });

    if (!employee || employee.role?.name !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all employees
    const employees = await prisma.employees.findMany({
      include: { role: true },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ data: employees });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, password, role_id } = await request.json();

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, password" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if this is the first employee
    const employeeCount = await prisma.employees.count();
    const isFirstEmployee = employeeCount === 0;

    if (!isFirstEmployee) {
      // Check if current user is admin
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const currentEmployee = await prisma.employees.findUnique({
        where: { id: user.id },
        include: { role: true },
      });

      if (!currentEmployee || currentEmployee.role?.name !== "admin") {
        return NextResponse.json(
          { error: "Only admins can create employees" },
          { status: 403 }
        );
      }
    }

    // Create Supabase Auth user via admin client
    const adminClient = getSupabaseAdmin();
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // Determine role_id
    let finalRoleId = role_id;
    if (isFirstEmployee) {
      // Create or get admin role for first employee
      let adminRole = await prisma.roles.findUnique({
        where: { name: "admin" },
      });

      if (!adminRole) {
        adminRole = await prisma.roles.create({
          data: {
            name: "admin",
            description: "Administrator role",
            is_active: true,
          },
        });
      }

      finalRoleId = adminRole.id;
    }

    // Create employee record
    const employee = await prisma.employees.create({
      data: {
        id: authData.user.id,
        name,
        email,
        role_id: finalRoleId || null,
        is_active: true,
      },
      include: { role: true },
    });

    return NextResponse.json(
      { data: employee },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create employee" },
      { status: 500 }
    );
  }
}
