import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_auth";
const SESSION_LENGTH_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("Missing ADMIN_SESSION_SECRET in your .env.local");
  return s;
}

function sign(payload) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createAdminSessionValue() {
  const expires = Date.now() + SESSION_LENGTH_MS;
  const payload = `${expires}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

function isValidSessionValue(value) {
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  return Number(payload) > Date.now();
}

// Use inside Server Components / Route Handlers.
export async function isAdminRequest() {
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE)?.value;
  return isValidSessionValue(value);
}
