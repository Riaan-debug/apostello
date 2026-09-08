import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { hasSupabaseEnv } from '@/lib/env';

const PROTECTED = ['/hub', '/kiosk'];

function sendToLogin(request: NextRequest) {
  const login = request.nextUrl.clone();
  login.pathname = '/login';
  login.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
  return NextResponse.redirect(login);
}

/**
 * Refreshes the Supabase session on every request and keeps signed-out
 * devices out of /hub and /kiosk. Role checks (staff vs admin vs kiosk) are
 * enforced by row level security and re-checked in the hub layout; this is
 * only the front door.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!hasSupabaseEnv()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (needsAuth && !user) return sendToLogin(request);

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets, the service worker and image files.
    '/((?!_next/static|_next/image|favicon.png|sw.js|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|svg|webp|avif|ico|pdf)$).*)',
  ],
};
