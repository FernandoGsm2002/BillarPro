// Tipos principales del sistema Billarea

export interface User {
  id: number;
  username: string;
  password: string;
  role: UserRole;
  name: string;
  shift: Shift;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
  SUPER_ADMIN = 'super_admin'
}

export enum Shift {
  MORNING = 'morning',    // Turno mañana
  AFTERNOON = 'afternoon', // Turno tarde
  NIGHT = 'night',        // Turno noche
  FULL_TIME = 'full_time' // Tiempo completo
}

export interface Table {
  id: number;
  number: number;
  type: TableType;
  status: TableStatus;
  hourlyRate: number;
  currentSessionId?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum TableType {
  POOL = 'pool',           // Mesa de pool
  SNOOKER = 'snooker',     // Mesa de snooker
  BILLIARD = 'billiard'    // Mesa de billar americano
}

export enum TableStatus {
  AVAILABLE = 'available',     // Disponible
  OCCUPIED = 'occupied',       // Ocupada
  RESERVED = 'reserved',       // Reservada
  MAINTENANCE = 'maintenance'  // En mantenimiento
}

export interface TableSession {
  id: number;
  tableId: number;
  userId: number;
  startTime: Date;
  endTime?: Date;
  duration?: number; // en minutos
  totalAmount: number;
  isPaid: boolean;
  customerName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  category: ProductCategory;
  price: number;
  stock: number;
  minStock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum ProductCategory {
  BEVERAGES = 'beverages',     // Bebidas
  SNACKS = 'snacks',          // Bocadillos
  CIGARETTES = 'cigarettes',   // Cigarrillos
  EQUIPMENT = 'equipment',     // Equipos (tacos, tizas, etc.)
  OTHER = 'other'             // Otros
}

export interface Sale {
  id: number;
  userId: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  items: SaleItem[];
  tableSessionId?: number;
  customerName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  id: number;
  saleId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export enum PaymentMethod {
  CASH = 'cash',           // Efectivo
  CARD = 'card',           // Tarjeta
  TRANSFER = 'transfer'    // Transferencia
}

export interface Inventory {
  id: number;
  productId: number;
  movementType: InventoryMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  userId: number;
  createdAt: Date;
}

export enum InventoryMovementType {
  IN = 'in',       // Entrada
  OUT = 'out',     // Salida
  ADJUSTMENT = 'adjustment' // Ajuste
}

// DTOs para requests
export interface LoginRequest {
  username: string;
  password: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  name: string;
  role: UserRole;
  shift: Shift;
}

export interface UpdateTableStatusRequest {
  status: TableStatus;
}

export interface StartTableSessionRequest {
  tableId: number;
  customerName?: string;
}

export interface EndTableSessionRequest {
  sessionId: number;
}

export interface CreateSaleRequest {
  items: {
    productId: number;
    quantity: number;
  }[];
  paymentMethod: PaymentMethod;
  customerName?: string;
  notes?: string;
  tableSessionId?: number;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  category: ProductCategory;
  price: number;
  stock: number;
  minStock: number;
}

export interface UpdateInventoryRequest {
  productId: number;
  quantity: number;
  reason: string;
  movementType: InventoryMovementType;
}

// Response types
export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export interface DashboardStats {
  todaySales: number;
  tablesOccupied: number;
  totalTables: number;
  lowStockProducts: number;
  activeSession: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Socket.io events
export interface SocketEvents {
  // Table events
  'table:statusChanged': (data: { tableId: number; status: TableStatus }) => void;
  'table:sessionStarted': (data: TableSession) => void;
  'table:sessionEnded': (data: TableSession) => void;
  
  // Sale events
  'sale:created': (data: Sale) => void;
  
  // Inventory events
  'inventory:lowStock': (data: { product: Product; currentStock: number }) => void;
  'inventory:updated': (data: { productId: number; newStock: number }) => void;
}

export interface JWTPayload {
  userId: number;
  username: string;
  role: UserRole;
} 