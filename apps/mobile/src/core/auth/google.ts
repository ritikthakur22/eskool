// Matches the type-3 web OAuth client in google-services.json.
// OAuth client IDs are public identifiers, not secrets.
export const GOOGLE_WEB_CLIENT_ID = '228295306473-t6cv4gac9pn81pbcgk6av05roi9j2662.apps.googleusercontent.com';

export function getGoogleSignInError(err: any, fallback: string = 'An error occurred during Google sign-in. Please try again.'): string {
  if (!err) return fallback;
  const code = String(err.code || err.message || '').toUpperCase();
  if (code.includes('SIGN_IN_CANCELLED') || code === '12501') return 'Sign-in was cancelled.';
  if (code.includes('IN_PROGRESS')) return 'Sign-in is already in progress.';
  if (code.includes('PLAY_SERVICES_NOT_AVAILABLE')) return 'Google Play Services are not available on this device.';
  if (code.includes('DEVELOPER_ERROR') || code === '10') return 'Google Sign-in is not fully configured for this release (SHA-1 fingerprint missing). Please contact the school admin.';
  if (code.includes('NETWORK_ERROR') || code === '7') return 'A network error occurred. Please check your connection and try again.';
  return err.message || fallback;
}
