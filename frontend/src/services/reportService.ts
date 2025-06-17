const API_BASE_URL = 'http://localhost:5000/api';

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  employeeId?: number;
  tableId?: number;
  period: 'day' | 'week' | 'month' | 'year';
}

export interface SalesReportData {
  date: string;
  sales: number;
  revenue: number;
  tableRevenue: number;
  inventoryRevenue: number;
}

export interface ProductReportData {
  productId: number;
  name: string;
  category: string;
  quantity: number;
  revenue: number;
  profit: number;
  averagePrice: number;
}

export interface UserReportData {
  userId: number;
  name: string;
  role: string;
  sales: number;
  revenue: number;
  tableRevenue: number;
  inventoryRevenue: number;
  sessionsHandled: number;
  averageSessionTime: number;
}

export interface TableReportData {
  tableId: number;
  tableName: string;
  hours: number;
  revenue: number;
  sessions: number;
  averageSessionTime: number;
  occupancyRate: number;
}

export interface EmployeeDetailedReport {
  employeeId: number;
  employeeName: string;
  role: string;
  period: string;
  tablesSessions: Array<{
    sessionId: number;
    tableId: number;
    tableName: string;
    startTime: string;
    endTime: string;
    duration: number;
    amount: number;
  }>;
  inventorySales: Array<{
    saleId: number;
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    saleTime: string;
  }>;
  totalTableRevenue: number;
  totalInventoryRevenue: number;
  totalRevenue: number;
  totalHours: number;
  totalSales: number;
  averageSessionTime: number;
}

class ReportService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('billarpro_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getSalesReport(filters: ReportFilters): Promise<SalesReportData[]> {
    try {
      console.log('🔍 Obteniendo reporte de ventas con filtros:', filters);
      const params = new URLSearchParams({
        period: filters.period,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      const response = await fetch(`${API_BASE_URL}/reports/sales?${params}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📊 Datos de reporte de ventas recibidos:', data);
      
      if (!data.success) {
        throw new Error(data.message || 'Error obteniendo reporte de ventas');
      }

      return data.data;
    } catch (error) {
      console.error('Error en getSalesReport:', error);
      throw error;
    }
  }

  async getProductsReport(filters: ReportFilters): Promise<ProductReportData[]> {
    try {
      console.log('🔍 Obteniendo reporte de productos con filtros:', filters);
      const params = new URLSearchParams({
        period: filters.period,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      const response = await fetch(`${API_BASE_URL}/reports/products?${params}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 Datos de reporte de productos recibidos:', data);
      if (!data.success) {
        throw new Error(data.message || 'Error obteniendo reporte de productos');
      }

      return data.data;
    } catch (error) {
      console.error('Error en getProductsReport:', error);
      throw error;
    }
  }

  async getUsersReport(filters: ReportFilters): Promise<UserReportData[]> {
    try {
      const params = new URLSearchParams({
        period: filters.period,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.employeeId && { employeeId: filters.employeeId.toString() })
      });

      const response = await fetch(`${API_BASE_URL}/reports/users?${params}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Error obteniendo reporte de usuarios');
      }

      return data.data;
    } catch (error) {
      console.error('Error en getUsersReport:', error);
      throw error;
    }
  }

  async getTablesReport(filters: ReportFilters): Promise<TableReportData[]> {
    try {
      const params = new URLSearchParams({
        period: filters.period,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.tableId && { tableId: filters.tableId.toString() })
      });

      const response = await fetch(`${API_BASE_URL}/reports/tables?${params}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Error obteniendo reporte de mesas');
      }

      return data.data;
    } catch (error) {
      console.error('Error en getTablesReport:', error);
      throw error;
    }
  }

  async getEmployeeDetailedReport(employeeId: number, filters: ReportFilters): Promise<EmployeeDetailedReport> {
    try {
      const params = new URLSearchParams({
        period: filters.period,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      const response = await fetch(`${API_BASE_URL}/reports/employee/${employeeId}?${params}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Error obteniendo reporte detallado del empleado');
      }

      return data.data;
    } catch (error) {
      console.error('Error en getEmployeeDetailedReport:', error);
      throw error;
    }
  }


}

export default new ReportService(); 