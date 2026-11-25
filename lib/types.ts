// Tipos base: empresa, roles, condición y movimientos
export type CompanyType = "tienda" | "organizacion";
export type Role = "propietario" | "administrador" | "operador" | "consulta";
export type Condition = "nuevo" | "bueno" | "regular" | "reparacion" | "danado";
export type MovementType = "entrada" | "salida" | "ajuste";

// Usuario completo (solo se usa internamente, nunca se envía al cliente)
export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

// Usuario sin la contraseña, es lo que se pasa a páginas y componentes
export type SafeUser = Omit<User, "passwordHash">;

// Sesión activa de un usuario
export type Session = { tokenHash: string; userId: string; expiresAt: string };

// Registro de intentos fallidos de login para bloqueo temporal
export type LoginAttempt = {
  key: string;
  count: number;
  firstAt: string;
  lockedUntil?: string;
};

// Empresa y membresía de un usuario a esa empresa
export type Company = { id: string; name: string; type: CompanyType; createdAt: string };
export type Membership = { userId: string; companyId: string; role: Role; createdAt: string };

// Categoría de productos o elementos
export type Category = { id: string; companyId: string; name: string };

// Producto (tienda) o elemento de trabajo (organización)
export type Item = {
  id: string;
  companyId: string;
  code: string;
  name: string;
  categoryId: string;
  unit: string;
  stock: number; // existencias en tienda, cantidad en organización
  location: string;
  photo?: string; // nombre del archivo de foto (opcional)
  parentId?: string; // si existe, este registro es variante del padre (solo un nivel)
  brand: string;
  model: string;
  // Campos exclusivos de tienda
  cost: number;
  price: number;
  minStock: number;
  // Campos exclusivos de organización
  condition?: Condition;
  serial: string;
  responsible: string;
  notes: string;
  maintenanceEveryDays?: number; // cada cuántos días toca mantenimiento
  lastMaintenanceAt?: string; // fecha del último mantenimiento confirmado
  createdAt: string;
  updatedAt: string;
};

// Entrada de cambio en el historial (campo, valor anterior, valor nuevo)
export type ChangeEntry = { field: string; from: string; to: string };

// Tipo de registro en el historial de un elemento
export type MaintenanceKind = "mantenimiento" | "cambio";

// Registro del historial de mantenimientos y cambios (solo organización)
export type MaintenanceRecord = {
  id: string;
  companyId: string;
  itemId: string;
  kind: MaintenanceKind;
  note: string;
  changes: ChangeEntry[]; // lista de campos modificados cuando kind es "cambio"
  userId: string;
  createdAt: string;
};

// Movimiento de stock (entrada, salida o ajuste), solo tienda
export type Movement = {
  id: string;
  companyId: string;
  itemId: string;
  type: MovementType;
  delta: number; // positivo suma, negativo resta
  stockAfter: number;
  note: string;
  userId: string;
  createdAt: string;
};

// Estructura completa de la base de datos
export type DB = {
  users: User[];
  sessions: Session[];
  loginAttempts: LoginAttempt[];
  companies: Company[];
  memberships: Membership[];
  categories: Category[];
  items: Item[];
  movements: Movement[];
  maintenance: MaintenanceRecord[];
};

// Estado de un formulario del servidor
export type FormState = { error?: string; ok?: string } | undefined;
