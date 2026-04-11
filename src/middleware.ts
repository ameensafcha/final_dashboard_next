import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getRequiredPermission, hasPermission } from '@/lib/permissions'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  const isLoginRoute = request.nextUrl.pathname.startsWith('/login')
  const isForbiddenRoute = request.nextUrl.pathname.startsWith('/forbidden') || request.nextUrl.pathname.startsWith('/unauthorized')

  // Agar user logged in nahi hai aur API route nahi hai, toh login bhejo
  if (!user && !isLoginRoute && !isApiRoute && !isForbiddenRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Agar user pehle se logged in hai aur /login page open karta hai, toh dashboard par bhejo
  if (user && isLoginRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // API routes par agar user nahi hai toh redirect ke bajaye 401 JSON bhejo
  if (!user && isApiRoute && !request.nextUrl.pathname.includes('/api/auth')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Permissions based dynamic route protection
  if (user && !isApiRoute && !isForbiddenRoute) {
    const requiredPermission = getRequiredPermission(request.nextUrl.pathname)

    if (requiredPermission) {
      // Fetch user role and permissions directly from DB using Supabase client (Edge-compatible)
      const { data: employeeData } = await supabase
        .from('employees')
        .select(`
          is_active,
          roles (
            name,
            role_permissions (
              permissions (
                action,
                resource
              )
            )
          )
        `)
        .eq('id', user.id)
        .single()

      const employee = employeeData as any

      // If no employee record or inactive, redirect or log out
      if (!employee || !employee.is_active) {
        // Option 1: Logout if inactive
        if (employee && !employee.is_active) {
          // We can't easily sign out from middleware and expect the UI to react immediately
          // but we can redirect to login and clear cookies
          const redirectResponse = NextResponse.redirect(new URL('/login', request.url))
          redirectResponse.cookies.delete('sb-access-token')
          redirectResponse.cookies.delete('sb-refresh-token')
          return redirectResponse
        }
        // If employee record is missing, it's a configuration issue or new user
        // Allow dashboard only if it's not restricted (usually it is though)
      }

      if (employee) {
        const role = employee.roles
        const isAdmin = role?.name === 'admin'
        const userPermissions = role?.role_permissions
          ?.map((rp: any) => `${rp.permissions.resource}:${rp.permissions.action}`) || []

        // 1. Specifically protect /admin/* for the 'admin' role
        if (request.nextUrl.pathname.startsWith('/admin') && !isAdmin) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // 2. Protect based on mapped permissions
        if (!hasPermission(userPermissions, requiredPermission, isAdmin)) {
          // Don't loop: if they don't have dashboard:view, but we redirect to /dashboard...
          // But dashboard:view should be granted to all active users.
          if (request.nextUrl.pathname !== '/dashboard') {
            return NextResponse.redirect(new URL('/dashboard', request.url))
          }
        }
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}