import { headers } from "next/headers";
import type { DB } from "./types";

// Límites de intentos y tiempos de bloqueo
export const MAX_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;
const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS_PER_IP = 20; // una IP puede compartirse entre varias personas

const MIN = 60_000;

// Obtiene la IP del cliente, considerando proxies
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || h.get("x-real-ip") || "desconocida";
}

// Claves para identificar un intento por correo o por IP
export const emailKey = (email: string) => `email:${email.toLowerCase().slice(0, 120)}`;
export const ipKey = (ip: string) => `ip:${ip}`;

const limitFor = (key: string) => (key.startsWith("ip:") ? MAX_ATTEMPTS_PER_IP : MAX_ATTEMPTS);

// Devuelve los minutos restantes de bloqueo, o 0 si no hay bloqueo activo
export function lockedMinutes(db: DB, keys: string[], now = Date.now()): number {
  let wait = 0;
  for (const key of keys) {
    const a = db.loginAttempts.find((x) => x.key === key);
    if (a?.lockedUntil && Date.parse(a.lockedUntil) > now) {
      wait = Math.max(wait, Math.ceil((Date.parse(a.lockedUntil) - now) / MIN));
    }
  }
  return wait;
}

// Suma un intento fallido y bloquea si se alcanzó el límite
export function recordFailure(db: DB, keys: string[], now = Date.now()): { remaining: number; locked: boolean } {
  let remaining = MAX_ATTEMPTS;
  let locked = false;
  for (const key of keys) {
    let a = db.loginAttempts.find((x) => x.key === key);
    if (!a || now - Date.parse(a.firstAt) > WINDOW_MINUTES * MIN) {
      db.loginAttempts = db.loginAttempts.filter((x) => x.key !== key);
      a = { key, count: 0, firstAt: new Date(now).toISOString() };
      db.loginAttempts.push(a);
    }
    a.count += 1;
    if (a.count >= limitFor(key)) {
      a.lockedUntil = new Date(now + LOCK_MINUTES * MIN).toISOString();
      a.count = 0;
      a.firstAt = new Date(now).toISOString();
      locked = true;
    }
    if (key.startsWith("email:")) remaining = Math.max(limitFor(key) - a.count, 0);
  }
  // Limpia registros viejos para que la tabla no crezca indefinidamente
  const cutoff = now - 24 * 60 * MIN;
  db.loginAttempts = db.loginAttempts.filter(
    (x) => Date.parse(x.lockedUntil ?? x.firstAt) > cutoff,
  );
  return { remaining, locked };
}

// Borra los intentos fallidos tras un login exitoso
export function clearFailures(db: DB, key: string): void {
  db.loginAttempts = db.loginAttempts.filter((x) => x.key !== key);
}

// Mensaje de bloqueo temporal que se muestra al usuario
export const lockMessage = (minutes: number) =>
  `Demasiados intentos fallidos. Por seguridad, espera ${minutes} minuto${minutes === 1 ? "" : "s"} antes de volver a intentarlo.`;
