"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { endSession, startSession } from "@/lib/auth";
import { mutate, readDB } from "@/lib/db";
import { clearFailures, clientIp, emailKey, ipKey, lockedMinutes, lockMessage, recordFailure } from "@/lib/login-guard";
import { hashPassword, verifyPassword } from "@/lib/password";
import { passwordProblem } from "@/lib/password-rules";
import type { FormState } from "@/lib/types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

// Hash fantasma para que un correo inexistente tarde lo mismo que uno real
let dummy: Promise<string> | undefined;
const dummyHash = () => (dummy ??= hashPassword("contraseña-que-no-existe"));

// Registra una cuenta nueva y abre sesión automáticamente
export async function register(_prev: FormState, fd: FormData): Promise<FormState> {
  const name = text(fd, "name");
  const email = text(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");

  if (name.length < 2 || name.length > 80) return { error: "Escribe tu nombre (entre 2 y 80 caracteres)." };
  if (!EMAIL.test(email) || email.length > 120) return { error: "Escribe un correo válido." };
  const problem = passwordProblem(password, { email, name });
  if (problem) return { error: problem };
  if (password !== confirm) return { error: "Las contraseñas no coinciden." };

  const passwordHash = await hashPassword(password);
  const result = await mutate((db): { error: string } | { id: string } => {
    if (db.users.some((u) => u.email === email)) return { error: "Ya existe una cuenta con ese correo." };
    const id = randomUUID();
    db.users.push({ id, name, email, passwordHash, createdAt: new Date().toISOString() });
    return { id };
  });
  if ("error" in result) return { error: result.error };

  await startSession(result.id);
  redirect("/empresas/nueva");
}

// Inicia sesión con correo y contraseña
export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = text(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: "Escribe tu correo y tu contraseña." };

  // Verifica si hay bloqueo activo por intentos fallidos
  const keys = [emailKey(email), ipKey(await clientIp())];
  const db = await readDB();
  const wait = lockedMinutes(db, keys);
  if (wait > 0) return { error: lockMessage(wait) };

  const user = password.length > 200 ? undefined : db.users.find((u) => u.email === email);
  const valid =
    password.length <= 200 && (await verifyPassword(password, user?.passwordHash ?? (await dummyHash())));

  // Credenciales incorrectas: registra el intento y avisa cuántos quedan
  if (!user || !valid) {
    const { remaining, locked } = await mutate((d) => recordFailure(d, keys));
    if (locked) return { error: lockMessage(15) };
    return {
      error:
        remaining <= 2
          ? `Correo o contraseña incorrectos. Te quedan ${remaining} intento${remaining === 1 ? "" : "s"} antes de un bloqueo temporal.`
          : "Correo o contraseña incorrectos.",
    };
  }

  // Login exitoso: limpia los intentos y redirige
  await mutate((d) => clearFailures(d, emailKey(email)));
  await startSession(user.id);
  const mine = db.memberships.filter((m) => m.userId === user.id);
  redirect(mine.length === 1 ? `/e/${mine[0].companyId}` : "/empresas");
}

// Cierra la sesión actual y redirige al login
export async function logout(): Promise<void> {
  await endSession();
  redirect("/iniciar-sesion");
}
