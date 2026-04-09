import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getUserRoleFromRequest, checkRoutePermission, PROTECTED_ROUTES, isPublicRoute } from "@/lib/auth-rbac";

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
    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from login page
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Role-based route protection for authenticated users
  if (user && !isApiRoute) {
    // Check if this is a protected route
    const isProtectedRoute = PROTECTED_ROUTES.some(
      (route) => pathname.startsWith(route) || pathname === route
    );

    if (isProtectedRoute) {
      // Check if user has permission to access this route
      const permission = await checkRoutePermission(request, pathname);

      if (!permission.allowed) {
        // Redirect to dashboard with error message
        const redirectUrl = new URL(
          `/dashboard?unauthorized=true&reason=${permission.reason || 'access_denied'}`,
          request.url
        );
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};