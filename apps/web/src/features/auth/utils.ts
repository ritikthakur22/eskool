// src/features/auth/utils.ts
const DEFAULT_REDIRECT = '/dashboard'; // change to your real landing route

// Only allow same-site relative paths (prevents open redirects).
export function getSafeNext(raw: string | null) {
  return raw && raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\')
    ? raw
    : DEFAULT_REDIRECT;
}