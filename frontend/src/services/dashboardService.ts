const API_BASE_URL = 'http://localhost:5000/api';

export interface DashboardStats {
  totalTables: number;
  activeTables: number;
  totalRevenue: number;
  todayRevenue: number;
  totalSales: number;
  todaySales: number;
  lowStockProducts: number;
  averageSessionTime: number;
  occupancyRate: number;
  totalProducts: number;
  totalUsers: number;
}

export interface ActivityItem {
  id: number;
  type: string;
  description: string;
  amount?: number | null;
  timestamp: string;
}

class DashboardService {
  private getAuthHeaders() {
    const token = localStorage.getItem('billarpro_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  async getStats(): Promise<DashboardStats> {
    try {
      const token = localStorage.getItem('billarpro_token');
      
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message || 'Error obteniendo estadísticas');
      }
    } catch (error) {
      console.error('Error connecting to dashboard API:', error);
      throw error;
    }
  }

  async getRecentActivity(): Promise<ActivityItem[]> {
    try {
      const token = localStorage.getItem('billarpro_token');
      
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(`${API_BASE_URL}/dashboard/activity`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message || 'Error obteniendo actividad');
      }
    } catch (error) {
      console.error('Error connecting to activity API:', error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService(); 