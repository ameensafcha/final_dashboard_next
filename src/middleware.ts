import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getUserRoleFromRequest, DEFAULT_ROUTE_PERMISSIONS } from "@/lib/auth-rbac";

const PROTECTED_ROUTES = ['/settings', '/admin', '/employees'];

const PUBLIC_ROUTES = [
  '/login',
  '/dashboard',
  '/batches',
  '/stock',
  '/api/auth/',
  '/_next/',
  '/favicon.ico',
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (route.endsWith('/')) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route;
  });
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname.startsWith(route) || pathname === route
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Create Supabase client for authentication
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();

  // Define routes that don't require authentication check
  const isAuthPage = pathname === "/login";
  const isApiRoute = pathname.startsWith("/api");
  const isPublic = isPublicRoute(pathname);

  // Redirect unauthenticated users to login (except for public routes and auth page)
  if (!user && !isAuthPage && !isApiRoute && !isPublic) {
    const redirectUrl = new URL("/login?error=unauthorized", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from login page
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Role-based route protection for authenticated users
  if (user && !isApiRoute) {
    const isProtectedPath = PROTECTED_ROUTES.some(
      (route) => pathname.startsWith(route) || pathname === route
    );

    if (isProtectedPath) {
      // Get user's role from the request
      const userRole = await getUserRoleFromRequest(request);
      const requiredRole = DEFAULT_ROUTE_PERMISSIONS[pathname] || 'admin';
      
      // Check role hierarchy
      const roleHierarchy = ['viewer', 'employee', 'admin'];
      const userRoleIndex = roleHierarchy.indexOf(userRole || 'viewer');
      const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
      
      if (userRoleIndex < requiredRoleIndex) {
        // Insufficient permissions - redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard?error=insufficient_role', request.url));
      }
    }
  }

  return response;
}

export const config = {
  runtime: 'nodejs',
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};