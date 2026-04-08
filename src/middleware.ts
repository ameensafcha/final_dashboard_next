import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          const cookieOptions = {
            ...options,
            sameSite: 'lax' as const,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
          };
          request.cookies.set({ name, value, ...cookieOptions });
          response.cookies.set({ name, value, ...cookieOptions });
        },
        remove(name: string, options: CookieOptions) {
          const cookieOptions = {
            ...options,
            sameSite: 'lax' as const,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
          };
          request.cookies.set({ name, value: "", ...cookieOptions });
          response.cookies.set({ name, value: "", ...cookieOptions });
        },
      },
    }
  );

  const isAuthPage = request.nextUrl.pathname === "/login";
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");

  // Get user once for all checks
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login (except auth pages and API routes)
  if (!user && !isAuthPage && !isApiRoute) {
    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is logged in and tries to access login page, redirect to dashboard
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};