import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/app/lib/database.types';

// ─── GET /api/auth/callback ───────────────────────────────────────────────────
// Handles the PKCE code exchange after a magic-link click or OAuth redirect.
// Supabase sends the user here with ?code=<pkce_code>&next=<intended_path>.

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  // Determine the correct destination based on user role
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const role = (user.user_metadata as Record<string, unknown>)?.role as string;
    if ((role === 'master_admin' || role === 'staff_admin') && next === '/') {
      return NextResponse.redirect(`${origin}/admin`);
    }
    if (next === '/') {
      return NextResponse.redirect(`${origin}/account`);
    }
  }

  return response;
}
