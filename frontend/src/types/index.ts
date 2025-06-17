// Tipos de usuario
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'employee' | 'manager' | 'super_admin';
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  permissions?: Permission[];
}

// Tipos de permisos
export interface Permission {
  id: number;
  name: string;
  description: string;
  module: 'tables' | 'pos' | 'inventory' | 'reports' | 'users' | 'settings';
  action: 'view' | 'create' | 'edit' | 'delete' | 'manage';
}

// Tipos de roles con permisos predefinidos
export interface Role {
  id: number;
  name: 'admin' | 'employee' | 'manager' | 'super_admin';
  displayName: string;
  description: string;
  permissions: Permission[];
  color: string;
}

// Tipos de mesa - CORREGIDO para coincidir con la base de datos
export interface Table {
  id: number;
  name: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  type: 'billiard' | 'pool' | 'snooker';
  hourlyRate: number;
  description?: string;
  isActive: boolean;
  currentSessionId?: number;
  sessionStartTime?: string;
  elapsedTime?: number; // en minutos
  createdAt: string;
  updatedAt: string;
}

// Tipos de sesión
export interface Session {
  id: number;
  tableId: number;
  userId: number;
  startTime: string;
  endTime?: string;
  totalAmount?: number;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  table?: Table;
  user?: User;
}

// Tipos de producto
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  minStock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Tipos de venta
export interface Sale {
  id: number;
  userId: number;
  sessionId?: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  status: 'completed' | 'pending' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  session?: Session;
  items: SaleItem[];
}

// Tipos de item de venta
export interface SaleItem {
  id: number;
  saleId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: Product;
}

// Tipos de inventario
export interface InventoryMovement {
  id: number;
  productId: number;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  userId: number;
  createdAt: string;
  product?: Product;
  user?: User;
}

// Tipos de dashboard
export interface DashboardStats {
  totalRevenue: number;
  totalSales: number;
  activeTables: number;
  totalTables: number;
  lowStockProducts: number;
  todayRevenue: number;
  todaySales: number;
  averageSessionTime: number;
  occupancyRate: number;
}

// Tipos de autenticación
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Tipos de respuesta de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Tipos de filtros y paginación
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TableFilters {
  status?: string;
  search?: string;
}

export interface SaleFilters {
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  status?: string;
  userId?: number;
}

export interface ProductFilters {
  category?: string;
  lowStock?: boolean;
  search?: string;
}

export interface UserFilters {
  role?: string;
  isActive?: boolean;
  search?: string;
}

// Tipos de notificaciones
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Tipos para formularios de usuario
export interface CreateUserData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'employee' | 'manager' | 'super_admin';
  password: string;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'employee' | 'manager' | 'super_admin';
  isActive?: boolean;
}

// Tipos para formularios de mesa
export interface CreateTableData {
  name: string;
  type: 'billiard' | 'pool' | 'snooker';
  hourlyRate: number;
  description?: string;
}

export interface UpdateTableData {
  name?: string;
  type?: 'billiard' | 'pool' | 'snooker';
  hourlyRate?: number;
  description?: string;
  isActive?: boolean;
}

// Tipos para configuración de tipos de mesa
export interface TableTypeConfig {
  type: 'billiard' | 'pool' | 'snooker';
  displayName: string;
  defaultRate: number;
  color: string;
  description: string;
}

// Tipos de reportes detallados
export interface EmployeeReport {
  employeeId: number;
  employeeName: string;
  role: string;
  period: string;
  tablesSessions: TableSessionReport[];
  inventorySales: InventorySaleReport[];
  totalTableRevenue: number;
  totalInventoryRevenue: number;
  totalRevenue: number;
  totalHours: number;
  totalSales: number;
  averageSessionTime: number;
  createdAt: string;
}

export interface TableSessionReport {
  sessionId: number;
  tableId: number;
  tableName: string;
  tableType: 'billiard' | 'pool' | 'snooker';
  startTime: string;
  endTime?: string;
  duration: number; // en minutos
  hourlyRate: number;
  totalAmount: number;
  status: 'active' | 'completed' | 'cancelled';
}

export interface InventorySaleReport {
  saleId: number;
  productId: number;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  timestamp: string;
  paymentMethod: 'cash' | 'card' | 'transfer';
}

export interface DailyReport {
  date: string;
  employees: EmployeeReport[];
  totalRevenue: number;
  totalTableRevenue: number;
  totalInventoryRevenue: number;
  totalSessions: number;
  totalSales: number;
  averageSessionTime: number;
  occupancyRate: number;
  topProducts: ProductSalesData[];
  topTables: TableUsageData[];
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  dailyReports: DailyReport[];
  totalRevenue: number;
  totalTableRevenue: number;
  totalInventoryRevenue: number;
  totalSessions: number;
  totalSales: number;
  averageSessionTime: number;
  averageOccupancyRate: number;
  topEmployees: EmployeePerformanceData[];
  topProducts: ProductSalesData[];
  topTables: TableUsageData[];
}

export interface MonthlyReport {
  month: string;
  year: number;
  weeklyReports: WeeklyReport[];
  totalRevenue: number;
  totalTableRevenue: number;
  totalInventoryRevenue: number;
  totalSessions: number;
  totalSales: number;
  averageSessionTime: number;
  averageOccupancyRate: number;
  topEmployees: EmployeePerformanceData[];
  topProducts: ProductSalesData[];
  topTables: TableUsageData[];
  growthRate: number;
}

export interface EmployeePerformanceData {
  employeeId: number;
  name: string;
  role: string;
  tableRevenue: number;
  inventoryRevenue: number;
  totalRevenue: number;
  totalSessions: number;
  totalSales: number;
  averageSessionTime: number;
  hoursWorked: number;
  revenuePerHour: number;
}

export interface ProductSalesData {
  productId: number;
  name: string;
  category: string;
  quantity: number;
  revenue: number;
  profit: number;
  averagePrice: number;
}

export interface TableUsageData {
  tableId: number;
  tableName: string;
  tableType: 'billiard' | 'pool' | 'snooker';
  totalSessions: number;
  totalHours: number;
  revenue: number;
  occupancyRate: number;
  averageSessionTime: number;
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  employeeId?: number;
  tableId?: number;
  reportType: 'daily' | 'weekly' | 'monthly';
  includeTableSessions: boolean;
  includeInventorySales: boolean;
}

export interface PDFExportOptions {
  title: string;
  subtitle: string;
  includeCharts: boolean;
  includeDetailedData: boolean;
  format: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
} 