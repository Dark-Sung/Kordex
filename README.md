# Inventario

Aplicación multi‑empresa de control de inventario hecha con **Next.js 15 (App Router) + TypeScript**. Los datos se guardan en una **base de datos SQLite** (un solo archivo, `data/inventario.db`) y las fotos en `data/uploads/`. No hay que instalar ni configurar ningún servidor de base de datos.

## Qué incluye

**Dos tipos de inventario** (se elige al registrar la empresa y no cambia después):

| | Tienda | Organización |
|---|---|---|
| Para | Negocios que venden productos | Equipos que solo inventarían sus elementos de trabajo |
| Campos | SKU, costo, precio, stock, stock mínimo, ubicación | Código, cantidad, estado, responsable, serial, ubicación, notas |
| Resumen | Valor del inventario y lista **Por reponer** | Elementos en buen estado y lista **Requieren atención** |
| Historial | **Movimientos**: entradas, salidas, ajustes | **Mantenimiento**: mantenimientos hechos y cambios a cada elemento |

**Mantenimiento (tipo Organización)**

- La sección *Movimientos* se reemplaza por **Mantenimiento**: plan de mantenimiento ordenado por urgencia (Vencido / Próximo / Al día) e historial de mantenimientos y cambios de todos los elementos, con filtros.
- Cada elemento tiene el atributo **Mantenimiento periódico** (cada semana, mes, 3 o 6 meses, año, o un número de días propio, o ninguno).
- El botón **Marcar hecho** confirma el mantenimiento con un solo clic: queda en el historial (quién y cuándo) y reinicia el conteo para el siguiente.
- Al **modificar un elemento** (nombre, marca, modelo, cantidad, estado, responsable, ubicación, notas, plan de mantenimiento…) se anota automáticamente en el historial qué cambió, de qué valor a cuál. También se puede anotar a mano un cambio o reparación desde la ficha.
- En organizaciones la cantidad se edita directamente en la ficha (ya no hay altas/bajas).

**Variantes (hijos)**

- Cualquier producto o elemento puede tener variantes: por ejemplo, el elemento *Televisor* de la categoría *Tecnología* con varios televisores de distinta marca y modelo. Se agregan desde la ficha con **Agregar variante**.
- Todos los registros tienen **Marca** y **Modelo**. Las variantes usan la categoría de su registro principal y, al crearlas, heredan sus datos como sugerencia.
- Es un solo nivel (una variante no tiene variantes). El registro principal muestra el total sumando sus variantes, y no se puede eliminar mientras tenga variantes. En «Por reponer» se evalúan las variantes, no el registro principal.

**Cuentas y empresas**

- Registro e inicio de sesión (contraseñas con scrypt, sesión en cookie `httpOnly`).
- **Bloqueo por contraseñas incorrectas:** tras 5 intentos fallidos con un mismo correo (o 20 desde una misma IP) se bloquea el inicio de sesión 15 minutos. Se avisa cuántos intentos quedan, y el bloqueo se aplica igual si el correo existe o no. Un inicio correcto reinicia el conteo.
- **Contraseñas nuevas:** mínimo 8 caracteres, con letras y números, sin espacios al inicio o al final, sin ser demasiado comunes ni contener el correo.
- Una cuenta puede pertenecer a varias empresas, con un rol distinto en cada una.
- Registro de empresas: nombre + tipo de inventario. Quien la crea queda como propietario.
- Se agrega gente al equipo por el **correo de su cuenta** (la persona debe haberse registrado antes).

**Roles**

| Rol | Puede |
|---|---|
| Propietario | Todo: equipo, nombre de la empresa, eliminarla |
| Administrador | Inventario, categorías, eliminar registros, gestionar operadores y consulta |
| Operador | Crear y editar registros, anotar movimientos |
| Solo consulta | Ver y descargar el CSV |

Reglas: un administrador no puede modificar a otro administrador ni a un propietario; siempre debe quedar al menos un propietario.

**Fotos (opcionales)** en productos y elementos: JPG, PNG o WebP de hasta 4 MB, con vista previa, para cambiarla o quitarla. Solo las ven las personas de esa empresa.

**Otros:** búsqueda y filtros, historial con quién registró cada movimiento, categorías, exportación a CSV (`Descargar CSV`), moneda COP.

## Cómo ejecutarlo

Requiere **Node.js 22.5 o superior** (la base SQLite usa el módulo `node:sqlite` que ya viene incluido en Node; no se instala nada más).

```bash
npm install
npm run dev
```

Abre http://localhost:3000.

**Datos de demostración (solo en `npm run dev`, la primera vez):**

| Cuenta | Contraseña | Rol |
|---|---|---|
| demo@inventario.local | demo1234 | Propietaria de *Ferretería La Esquina* (tienda) y de *Fundación Horizonte* (organización) |
| operador@inventario.local | demo1234 | Operador en la tienda, solo consulta en la organización |

Con `npm run build && npm start` la base arranca **vacía**, sin cuentas de ejemplo: la primera persona crea su cuenta desde la página de registro.

Si ya probaste con los datos de demostración y quieres empezar de cero en desarrollo, detén el servidor y borra `data/inventario.db` (y sus archivos `inventario.db-wal` / `inventario.db-shm`) y `data/uploads/`; en el siguiente `npm run dev` se cargará la demostración de nuevo. Para una base vacía usa el modo producción.

**Si vienes de la versión con `db.json`:** al arrancar por primera vez, sus datos se importan solos a SQLite y el archivo se renombra a `db.migrado-….json` (queda como copia). Las versiones aún más antiguas, sin cuentas, se renombran a `db.anterior-….json` y se crea una base nueva.

## Estructura

```
app/
  (auth)/iniciar-sesion, registro      Cuentas
  empresas/                            Lista de empresas y registro de empresa
  e/[companyId]/                       Todo lo de una empresa
    page.tsx                           Resumen (cambia según el tipo)
    inventario/                        Listado, alta y ficha (productos o elementos)
    movimientos/ (tienda)              Entradas, salidas y ajustes
    mantenimiento/ (organización)      Plan de mantenimiento e historial de cambios
    categorias/ equipo/ ajustes/ exportar/
  api/fotos/[companyId]/[file]         Entrega las fotos solo a miembros
  actions/                             Acciones del servidor (auth, empresas, items, equipo, categorías)
components/                            Formularios, foto, barra lateral, etiquetas
lib/
  db.ts            Base SQLite: esquema, lectura y escritura transaccional (readDB / mutate)
  seed.ts          Datos de demostración
  hierarchy.ts     Variantes (hijos) y totales
  maintenance.ts   Fechas de mantenimiento y comparación de cambios
  login-guard.ts   Bloqueo por intentos fallidos
  password-rules.ts Reglas de contraseñas nuevas
  auth.ts          Sesiones, contexto de empresa y autorización
  permissions.ts   Roles y qué puede hacer cada uno
  labels.ts        Textos distintos para tienda y organización
  photos.ts        Validación y guardado de fotos
```

## Seguridad y despliegue

- Cada acción del servidor revisa en el servidor que la persona pertenezca a la empresa y que su rol permita la acción; ocultar un botón en pantalla no es la única barrera. Todos los datos se filtran por empresa.
- Las fotos se validan por su contenido (no solo por la extensión) y no están en una carpeta pública.
- Hay bloqueo por intentos fallidos, pero **no hay recuperación de contraseña por correo**. Agrégala antes de exponerlo en internet, y sírvelo siempre con HTTPS. Si usas un proxy inverso, haz que envíe la cabecera `X-Forwarded-For` para que el límite por IP funcione.
- El almacenamiento es el sistema de archivos (SQLite + fotos): sirve para un servidor propio o un VPS con disco persistente (usa `DATA_DIR` para apuntar a él). **No funciona en hosting serverless** (por ejemplo Vercel) porque allí el disco no es persistente. Haz copias de seguridad de la carpeta `data/` completa (con el servidor detenido, o copiando también los archivos `-wal` y `-shm`).
- SQLite aguanta bien un servidor con decenas de usuarios. Para más carga o varios servidores, cambia `lib/db.ts` por PostgreSQL; las páginas y acciones solo dependen de `readDB()` y `mutate()`. El módulo `node:sqlite` aún está marcado como experimental en Node: si prefieres algo más establecido, `better-sqlite3` tiene casi la misma interfaz y solo habría que cambiar la conexión en `lib/db.ts`.
- Fechas y moneda están configuradas para Colombia (`es-CO`, COP, `America/Bogota`) en `lib/format.ts`.
