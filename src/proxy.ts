import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, hashPassword } from '@/lib/auth-token';

export async function proxy(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  // No password configured: leave the app open rather than lock everyone out.
  if (!password) return NextResponse.next();

  const cookie = request.cookies.get(AUTH_COOKIE)?.value;
  const expected = await hashPassword(password);

  if (cookie === expected) return NextResponse.next();

  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Protect everything except:
     * - /login (the password form itself)
     * - Next.js internals and static assets
     */
    '/((?!login|_next/static|_next/image|favicon.ico).*)',
  ],
};
