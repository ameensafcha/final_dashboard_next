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

  // Agar user logged in nahi hai aur API route nahi hai, toh login bhejo
  if (!user && !isLoginRoute && !isApiRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // API routes par agar user nahi hai toh redirect ke bajaye 401 JSON bhejo
  if (!user && isApiRoute && !request.nextUrl.pathname.includes('/api/auth')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}