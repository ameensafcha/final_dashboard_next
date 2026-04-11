// src/app/api/auth/employee/route.ts
import { createServerSupabaseClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Next.js 15+ mein cookies ko await karna zaroori hai
    const cookieStore = await cookies(); 

    const supabase = createServerSupabaseClient({
      getAll() {
        return cookieStore.getAll()
      },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employee = await prisma.employees.findUnique({
      where: { id: user.id },
      include: {
        role: {
          include: {
            permissions: {
              where: { is_active: true }
            }
          }
        }
      }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}