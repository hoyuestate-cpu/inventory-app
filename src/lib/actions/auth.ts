'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE, hashPassword } from '@/lib/auth-token';

export async function login(formData: FormData) {
  const password = String(formData.get('password') ?? '');
  const expected = process.env.SITE_PASSWORD;

  if (!expected || password !== expected) {
    redirect('/login?error=1');
  }

  const token = await hashPassword(expected);
  const store = await cookies();
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect('/');
}

export async function logout() {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
  redirect('/login');
}
