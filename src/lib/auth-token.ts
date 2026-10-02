export const AUTH_COOKIE = 'soumu_auth';

// Uses Web Crypto (available in both the Node.js server action runtime and
// the Edge middleware runtime) so the same hashing logic works in both places.
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
