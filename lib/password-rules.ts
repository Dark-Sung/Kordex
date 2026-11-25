// Valida que la contraseña cumpla las reglas mínimas
// Devuelve el mensaje del problema encontrado, o null si es válida
export function passwordProblem(password: string, context: { email?: string; name?: string } = {}): string | null {
  if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
  if (password.length > 200) return "La contraseña es demasiado larga.";
  if (/^\s|\s$/.test(password)) return "La contraseña no puede empezar ni terminar con espacios.";
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(password) || !/\d/.test(password))
    return "La contraseña debe combinar letras y números.";
  if (/^(.)\1+$/.test(password)) return "La contraseña no puede ser un solo carácter repetido.";

  // Rechaza contraseñas que contengan la parte local del correo del usuario
  const lower = password.toLowerCase();
  const local = context.email?.split("@")[0]?.toLowerCase();
  if (local && local.length >= 4 && lower.includes(local)) return "La contraseña no debe contener tu correo.";

  // Rechaza contraseñas demasiado comunes
  if (COMMON.has(lower)) return "Esa contraseña es demasiado común. Elige otra.";
  return null;
}

// Lista de contraseñas comunes bloqueadas
const COMMON = new Set([
  "12345678", "123456789", "1234567890", "password1", "password123", "qwerty123", "abc12345",
  "contraseña1", "contrasena1", "contraseña123", "iloveyou1", "admin123", "admin1234", "colombia123",
]);
