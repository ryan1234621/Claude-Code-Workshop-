import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// ─── Route guard config ───────────────────────────────────────────────────────

const ADMIN_PREFIX   = '/admin';
const ACCOUNT_PREFIX = '/account';
const AUTH_ROUTES    = ['/login', '/register', '/forgot-password'];

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — must be called before checking getUser()
  const { data: { user } } = await supabase.auth.getUser();

  // ── Redirect authenticated users away from auth pages ──────────────────────
  if (user && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    const role = (user.user_metadata as Record<string, unknown>)?.role as string;
    const dest = (role === 'master_admin' || role === 'staff_admin') ? '/admin' : '/account';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // ── Guard /account — requires any authenticated user ───────────────────────
  if (pathname.startsWith(ACCOUNT_PREFIX) && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Guard /admin — requires master_admin or staff_admin ────────────────────
  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    const role = (user.user_metadata as Record<string, unknown>)?.role as string;
    if (role !== 'master_admin' && role !== 'staff_admin') {
      return NextResponse.redirect(new URL('/account', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Run on everything except Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
