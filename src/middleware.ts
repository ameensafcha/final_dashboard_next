import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
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

  // 1. Auth Guard: Logged in status for all protected routes
  if (!user && !isLoginRoute && !isApiRoute && !isForbiddenRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Redirect logged-in users from login page
  if (user && isLoginRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 3. API Protection: Simple auth check
  if (!user && isApiRoute && !request.nextUrl.pathname.includes('/api/auth')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 4. Admin Guard: Simple email-based bypass for /admin or just let everyone in for now
  if (user && request.nextUrl.pathname.startsWith('/admin')) {
    const isSuperAdmin = process.env.SUPER_ADMIN_EMAIL && user.email === process.env.SUPER_ADMIN_EMAIL;
    if (!isSuperAdmin) {
      // In a completely simplified world, we might just allow all authenticated users.
      // But let's keep a tiny bit of protection for /admin if desired.
      // return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
