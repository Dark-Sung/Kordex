import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createHash, randomBytes } from "crypto";
import { mutate, readDB } from "./db";
import { can, type Action } from "./permissions";
import type { Company, Role, SafeUser } from "./types";

// Nombre de la cookie de sesión y duración en días
const COOKIE = "inv_session";
const SESSION_DAYS = 30;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export const NO_PERMISSION = "No tienes permiso para hacer esto en esta empresa.";

// Crea una sesión nueva y deposita la cookie en el navegador
export async function startSession(userId: string, expectedPasswordHash?: string): Promise<boolean> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const started = await mutate((db) => {
    const user = db.users.find((entry) => entry.id === userId);
    if (!user || (expectedPasswordHash !== undefined && user.passwordHash !== expectedPasswordHash)) return false;
    const now = new Date().toISOString();
    db.sessions = db.sessions.filter((s) => s.expiresAt > now);
    db.sessions.push({ tokenHash: hashToken(token), userId, expiresAt: expires.toISOString() });
    return true;
  });
  if (!started) return false;
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
  return true;
}

// Cierra la sesión actual y borra la cookie
export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const h = hashToken(token);
    await mutate((db) => {
      db.sessions = db.sessions.filter((s) => s.tokenHash !== h);
    });
  }
  jar.delete(COOKIE);
}

// Devuelve el usuario actual si tiene sesión válida, o null si no
export async function getCurrentUser(): Promise<SafeUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const h = hashToken(token);
  const db = await readDB();
  const session = db.sessions.find((s) => s.tokenHash === h);
  if (!session || session.expiresAt <= new Date().toISOString()) return null;
  const user = db.users.find((u) => u.id === session.userId);
  if (!user) return null;
  const { passwordHash: _omit, ...safe } = user;
  void _omit;
  return safe;
}

// Exige que haya un usuario con sesión activa; redirige al login si no
export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/iniciar-sesion");
  return user;
}

export type Ctx = { user: SafeUser; company: Company; role: Role };

// Devuelve usuario, empresa y rol si el usuario pertenece a esa empresa
export async function getContext(companyId: string): Promise<Ctx | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const db = await readDB();
  const membership = db.memberships.find((m) => m.userId === user.id && m.companyId === companyId);
  const company = db.companies.find((c) => c.id === companyId);
  if (!membership || !company) return null;
  return { user, company, role: membership.role };
}

// Para páginas: redirige al login o muestra 404 si el usuario no tiene acceso
export async function requireContext(companyId: string): Promise<Ctx> {
  await requireUser();
  const ctx = await getContext(companyId);
  if (!ctx) notFound();
  return ctx;
}

// Para acciones del servidor: devuelve el contexto solo si el rol permite la acción
export async function authorize(companyId: string, action: Action): Promise<Ctx | null> {
  await requireUser();
  const ctx = await getContext(companyId);
  if (!ctx || !can(ctx.role, action)) return null;
  return ctx;
}
