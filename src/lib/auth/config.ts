export const authSessionCookieName = "auth_session";
export const emailCodeTtlMs = 10 * 60 * 1000;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function adminEmail() {
  return normalizeEmail(process.env.ADMIN_EMAIL || "");
}
