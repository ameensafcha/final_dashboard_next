import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

interface EmployeeResponse {
  id: string;
  name: string;
  email: string;
  role_id: string | null;
  is_active: boolean;
  role: {
    name: string;
  } | null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate user session using getCurrentUser (which uses getUser() server-side)
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch employee data from Prisma (single source of truth for role)
    const employee = await prisma.employees.findUnique({
      where: { id: user.id },
      include: {
        role: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Server-side is_active check (D-03, D-04)
    // Note: getCurrentUser already validates is_active, but we return the data for client
    const response: EmployeeResponse = {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role_id: employee.role_id,
      is_active: employee.is_active,
      role: employee.role ? { name: employee.role.name } : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API /auth/employee] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}