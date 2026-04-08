import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";

async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  const { createServerClient } = await import("@supabase/ssr");
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log("[API/employees/GET] Auth result:", { user: user?.id, authError });
    
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
    const supabase = await getSupabaseServerClient();
    
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

    // Update employee record (trigger already created it with guest role)
    const employee = await prisma.employees.update({
      where: { id: authData.user.id },
      data: {
        name,
        email,
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

export async function PUT(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const currentEmployee = await prisma.employees.findUnique({
      where: { id: user.id },
      include: { role: true },
    });

    if (!currentEmployee || currentEmployee.role?.name !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, name, role_id, is_active } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Employee ID required" }, { status: 400 });
    }

    const employee = await prisma.employees.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(role_id && { role_id }),
        ...(typeof is_active === "boolean" && { is_active }),
        updated_at: new Date(),
      },
      include: { role: true },
    });

    return NextResponse.json({ data: employee });
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const currentEmployee = await prisma.employees.findUnique({
      where: { id: user.id },
      include: { role: true },
    });

    if (!currentEmployee || currentEmployee.role?.name !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Employee ID required" }, { status: 400 });
    }

    // Soft delete - set is_active to false
    await prisma.employees.update({
      where: { id },
      data: { is_active: false, updated_at: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
