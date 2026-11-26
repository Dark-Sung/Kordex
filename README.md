# Inventario

Aplicación multi‑empresa de control de inventario hecha con **Next.js 15 (App Router) + TypeScript**. Los datos se guardan en una **base de datos SQLite** (un solo archivo, `data/inventario.db`) y las fotos en `data/uploads/`. No hay que instalar ni configurar ningún servidor de base de datos.

## Qué incluye

**Dos tipos de inventario** (se elige al registrar la empresa y no cambia después):

| | Tienda | Organización |
|---|---|---|
| Para | Negocios que venden productos | Equipos que solo inventarían sus elementos de trabajo |
| Campos | ID, costo, precio, stock, stock mínimo, ubicación | ID, cantidad, estado, responsable, serial, ubicación, notas |
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

### Despliegue en AWS

El workflow `.github/workflows/ci.yml` compila los cambios de un pull request. Al actualizar `main`, `.github/workflows/deploy-aws.yml` compila Kordex, comprueba que la página pública y el inicio de sesión respondan, publica el paquete de Next.js en S3 y lo instala con AWS Systems Manager Run Command en la instancia activa del grupo Auto Scaling. También puede ejecutarse desde la pestaña **Actions**.

1. Crea el entorno de GitHub `aws-production` para `main` y configura `AWS_REGION`, `AWS_BUCKET`, `AWS_ASG_NAME` y `AWS_DEPLOY_ROLE_ARN`. El rol OIDC de GitHub necesita publicar en el prefijo `releases/`, consultar el ASG, enviar el comando a su instancia y consultar el resultado. Verifica que el laboratorio de AWS Academy permita configurar el rol.
2. Prepara una instancia Linux x86-64 compatible con Ubuntu 22.04, Node.js 22 en `/usr/bin/node`, AWS CLI y SSM Agent conectado. El perfil de instancia debe permitir uso de SSM, lectura de `releases/` y escritura de `backups/` y `releases/current.txt` en el bucket privado. Instala `deploy/aws/kordex.service` como `/etc/systemd/system/kordex.service`, crea el usuario y grupo `kordex` y ejecuta `sudo systemctl daemon-reload`.
3. Monta EBS en `/var/lib/kordex` y dale escritura al usuario `kordex`. Configura el punto de montaje y su recuperación en la plantilla de lanzamiento antes de confiar en el reemplazo de una instancia. Usa HTTPS mediante un proxy inverso en EC2 hacia `127.0.0.1:3000`, ya que la sesión de producción usa una cookie segura.
4. Configura el ASG con capacidad mínima y deseada de 1. Puedes conservar el máximo de 2 del diagrama, con las políticas de aumento deshabilitadas mientras la base sea SQLite local. El workflow exige una sola instancia activa. Antes de cambiar de versión, se detiene Kordex y se respalda el volumen de datos, incluidas las fotos, en S3. Si la nueva versión falla la comprobación, se vuelve a iniciar la versión anterior cuando existe.

El despliegue actual conserva SQLite y las fotos de la aplicación en EBS. S3 recibe los paquetes de código y los respaldos de ambos. El acceso directo a imágenes en S3 y los reportes PDF o Excel del diagrama requieren implementación adicional. Kordex actualmente exporta CSV.

Para recuperar una instancia reemplazada, vuelve a montar el volumen original o restaura un respaldo de `backups/` en un volumen vacío, con el servicio detenido. Lee el identificador de `releases/current.txt` en S3, descarga `releases/<identificador>/install-release.sh` y ejecútalo como root con el nombre del bucket y el identificador. Confirma que el acceso HTTPS y los datos restaurados estén disponibles antes de dirigir tráfico a la instancia.

- Cada acción del servidor revisa en el servidor que la persona pertenezca a la empresa y que su rol permita la acción; ocultar un botón en pantalla no es la única barrera. Todos los datos se filtran por empresa.
- Las fotos se validan por su contenido (no solo por la extensión) y no están en una carpeta pública.
- Hay bloqueo por intentos fallidos, pero **no hay recuperación de contraseña por correo**. Agrégala antes de exponerlo en internet, y sírvelo siempre con HTTPS. Si usas un proxy inverso, haz que envíe la cabecera `X-Forwarded-For` para que el límite por IP funcione.
- El almacenamiento es el sistema de archivos (SQLite + fotos): sirve para un servidor propio o un VPS con disco persistente (usa `DATA_DIR` para apuntar a él). **No funciona en hosting serverless** (por ejemplo Vercel) porque allí el disco no es persistente. Haz copias de seguridad de la carpeta `data/` completa (con el servidor detenido, o copiando también los archivos `-wal` y `-shm`).
- SQLite aguanta bien un servidor con decenas de usuarios. Para más carga o varios servidores, cambia `lib/db.ts` por PostgreSQL; las páginas y acciones solo dependen de `readDB()` y `mutate()`. El módulo `node:sqlite` aún está marcado como experimental en Node: si prefieres algo más establecido, `better-sqlite3` tiene casi la misma interfaz y solo habría que cambiar la conexión en `lib/db.ts`.
- Fechas y moneda están configuradas para Colombia (`es-CO`, COP, `America/Bogota`) en `lib/format.ts`.
