// Simple in-memory store for login attempts (for demo; use Redis or DB in production)
const attempts: Record<string, { count: number; lastAttempt: number; lockUntil: number }> = {};

export function recordLoginAttempt(email: string, success: boolean) {
  const now = Date.now();
  if (!attempts[email]) {
    attempts[email] = { count: 0, lastAttempt: now, lockUntil: 0 };
  }
  if (success) {
    attempts[email] = { count: 0, lastAttempt: now, lockUntil: 0 };
    return;
  }
  const entry = attempts[email];
  entry.count += 1;
  entry.lastAttempt = now;
  if (entry.count >= 5) {
    // Lock for 10s * (count - 4)
    entry.lockUntil = now + 10000 * (entry.count - 4);
  }
}

export function isLocked(email: string): number {
  const entry = attempts[email];
  if (!entry) return 0;
  const now = Date.now();
  if (entry.lockUntil > now) {
    return Math.ceil((entry.lockUntil - now) / 1000);
  }
  return 0;
}

export function getFailedAttempts(): { email: string; count: number; lockUntil: number }[] {
  return Object.entries(attempts)
    .filter(([_, v]) => v.count >= 5)
    .map(([email, v]) => ({ email, count: v.count, lockUntil: v.lockUntil }));
}
