"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { endSession, requireUser, startSession } from "@/lib/auth";
import { mutate, readDB } from "@/lib/db";
import { clearFailures, clientIp, emailKey, ipKey, lockedMinutes, lockMessage, recordFailure } from "@/lib/login-guard";
import { hashPassword, verifyPassword } from "@/lib/password";
import { passwordProblem } from "@/lib/password-rules";
import { deleteProfilePhoto, isUpload, saveProfilePhoto } from "@/lib/photos";
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
  if (!(await startSession(user.id, user.passwordHash))) {
    return { error: "Las credenciales cambiaron. Vuelve a iniciar sesión." };
  }
  const mine = db.memberships.filter((m) => m.userId === user.id);
  redirect(mine.length === 1 ? `/e/${mine[0].companyId}` : "/empresas");
}

export async function updateProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const current = await requireUser();
  const name = text(fd, "name");
  const email = text(fd, "email").toLowerCase();
  if (name.length < 2 || name.length > 80) return { error: "Escribe tu nombre (entre 2 y 80 caracteres)." };
  if (!EMAIL.test(email) || email.length > 120) return { error: "Escribe un correo válido." };

  const changingEmail = email !== current.email;
  const confirmationKey = `perfil:${current.id}`;
  let confirmedHash: string | undefined;
  if (changingEmail) {
    const password = String(fd.get("currentPassword") ?? "");
    if (!password || password.length > 200) return { error: "Escribe tu contraseña actual para cambiar el correo." };
    const db = await readDB();
    const wait = lockedMinutes(db, [confirmationKey]);
    if (wait > 0) return { error: lockMessage(wait) };

    const account = db.users.find((user) => user.id === current.id);
    if (!account || !(await verifyPassword(password, account.passwordHash))) {
      const { locked } = await mutate((data) => recordFailure(data, [confirmationKey]));
      return { error: locked ? lockMessage(15) : "La contraseña actual es incorrecta." };
    }
    confirmedHash = account.passwordHash;
  }

  const result = await mutate((db): FormState => {
    const account = db.users.find((user) => user.id === current.id);
    if (!account || account.email !== current.email || (changingEmail && account.passwordHash !== confirmedHash)) {
      return { error: "Tu cuenta cambió mientras editabas. Recarga la página e inténtalo de nuevo." };
    }
    if (db.users.some((user) => user.id !== account.id && user.email === email)) {
      return { error: "Ya existe una cuenta con ese correo." };
    }

    account.name = name;
    account.email = email;
    if (changingEmail) clearFailures(db, confirmationKey);
    return { ok: "Guardamos tus cambios." };
  });

  if (result?.ok) revalidatePath("/", "layout");
  return result;
}

export async function changePassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const current = await requireUser();
  const oldPassword = String(fd.get("currentPassword") ?? "");
  const password = String(fd.get("password") ?? "");
  if (!oldPassword || oldPassword.length > 200) return { error: "Escribe tu contraseña actual." };
  const problem = passwordProblem(password, current);
  if (problem) return { error: problem };
  if (password !== fd.get("confirm")) return { error: "Las contraseñas nuevas no coinciden." };
  if (password === oldPassword) return { error: "Elige una contraseña diferente de la actual." };

  const key = `perfil:${current.id}`;
  const db = await readDB();
  const wait = lockedMinutes(db, [key]);
  if (wait > 0) return { error: lockMessage(wait) };
  const account = db.users.find((user) => user.id === current.id);
  if (!account || !(await verifyPassword(oldPassword, account.passwordHash))) {
    const { locked } = await mutate((data) => recordFailure(data, [key]));
    return { error: locked ? lockMessage(15) : "La contraseña actual es incorrecta." };
  }

  const hash = await hashPassword(password);
  const changed = await mutate((data) => {
    const user = data.users.find((entry) => entry.id === current.id);
    if (!user || user.passwordHash !== account.passwordHash || user.email !== current.email) return false;
    user.passwordHash = hash;
    data.sessions = data.sessions.filter((session) => session.userId !== user.id);
    clearFailures(data, key);
    return true;
  });
  if (!changed) return { error: "Tu cuenta cambió. Recarga la página e inténtalo de nuevo." };

  if (!(await startSession(current.id, hash))) redirect("/iniciar-sesion");
  return { ok: "Actualizamos tu contraseña y cerramos las demás sesiones." };
}

export async function updateProfilePhoto(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const file = fd.get("photo");
  let filename: string | undefined;
  if (isUpload(file)) {
    const saved = await saveProfilePhoto(user.id, file);
    if ("error" in saved) return saved;
    filename = saved.filename;
  } else if (!fd.has("removePhoto")) {
    return { error: "Elige una foto." };
  }

  let previous: string | undefined;
  try {
    previous = await mutate((db) => {
      const account = db.users.find((entry) => entry.id === user.id);
      if (!account) throw new Error("Cuenta no encontrada");
      const oldPhoto = account.photo;
      account.photo = filename;
      return oldPhoto;
    });
  } catch {
    await deleteProfilePhoto(user.id, filename).catch(() => {});
    return { error: "No pudimos actualizar tu foto. Inténtalo de nuevo." };
  }

  await deleteProfilePhoto(user.id, previous).catch(() => {});
  revalidatePath("/", "layout");
  return { ok: filename ? "Guardamos tu foto de perfil." : "Quitamos tu foto de perfil." };
}

// Cierra la sesión actual y redirige al login
export async function logout(): Promise<void> {
  await endSession();
  redirect("/iniciar-sesion");
}
