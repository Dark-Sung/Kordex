import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";

// Versión promisificada de scrypt para usarla con async/await
const scrypt = promisify(scryptCb) as unknown as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

// Genera un hash seguro de la contraseña con sal aleatoria
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

// Compara una contraseña en texto plano con su hash almacenado
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const key = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return key.length === expected.length && timingSafeEqual(key, expected);
}
