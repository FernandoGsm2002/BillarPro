import { Request, Response } from 'express';
import { query, isDatabaseConnected } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { APIResponse } from '../types';

interface ReportFilters {
  period: 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
  employeeId?: number;
  tableId?: number;
}

interface SalesReportData {
  date: string;
  sales: number;
  revenue: number;
  tableRevenue: number;
  inventoryRevenue: number;
}

interface ProductReportData {
  productId: number;
  name: string;
  category: string;
  quantity: number;
  revenue: number;
  profit: number;
  averagePrice: number;
}

interface UserReportData {
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

interface TableReportData {
  tableId: number;
  tableName: string;
  hours: number;
  revenue: number;
  sessions: number;
  averageSessionTime: number;
  occupancyRate: number;
}

// Obtener reporte de ventas
export const getSalesReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!isDatabaseConnected()) {
    res.json({
      success: true,
      data: [],
      message: 'Reporte de ventas (sin base de datos)'
    });
    return;
  }

  try {
    const { period } = req.query as any;
    
    let dateFilter = '';
    let groupBy = '';
    
    switch (period) {
      case 'day':
        dateFilter = 'AND DATE(created_at) = CURRENT_DATE';
        groupBy = "DATE(created_at)";
        break;
      case 'week':
        dateFilter = 'AND created_at >= CURRENT_DATE - INTERVAL \'7 days\'';
        groupBy = "DATE(created_at)";
        break;
      case 'month':
        dateFilter = 'AND created_at >= CURRENT_DATE - INTERVAL \'30 days\'';
        groupBy = "DATE(created_at)";
        break;
      case 'year':
        dateFilter = 'AND created_at >= CURRENT_DATE - INTERVAL \'365 days\'';
        groupBy = "DATE_TRUNC('month', created_at)";
        break;
      default:
        dateFilter = 'AND created_at >= CURRENT_DATE - INTERVAL \'30 days\'';
        groupBy = "DATE(created_at)";
    }

    // Obtener datos de ventas combinadas (inventario + mesas)
    const salesQuery = `
      WITH daily_sales AS (
        SELECT 
          ${groupBy} as date,
          COUNT(*) as sales,
          SUM(total_amount) as inventory_revenue,
          0 as table_revenue
        FROM sales 
        WHERE 1=1 ${dateFilter}
        GROUP BY ${groupBy}
        
        UNION ALL
        
        SELECT 
          ${groupBy.replace('created_at', 'end_time')} as date,
          COUNT(*) as sales,
          0 as inventory_revenue,
          SUM(total_amount) as table_revenue
        FROM table_sessions 
        WHERE end_time IS NOT NULL AND total_amount > 0 ${dateFilter.replace('created_at', 'end_time')}
        GROUP BY ${groupBy.replace('created_at', 'end_time')}
      )
      SELECT 
        date::date as date,
        SUM(sales) as sales,
        SUM(inventory_revenue + table_revenue) as revenue,
        SUM(table_revenue) as table_revenue,
        SUM(inventory_revenue) as inventory_revenue
      FROM daily_sales
      GROUP BY date
      ORDER BY date DESC
      LIMIT 30
    `;

    const result = await query(salesQuery);
    
    let salesData = result.rows.map((row: any) => ({
      date: row.date,
      sales: parseInt(row.sales || 0),
      revenue: parseFloat(row.revenue || 0),
      tableRevenue: parseFloat(row.table_revenue || 0),
      inventoryRevenue: parseFloat(row.inventory_revenue || 0)
    }));

    // Si hay muy pocos datos, agregar datos históricos simulados para mejor visualización
    if (salesData.length < 7 && period === 'month') {
      const today = new Date();
      const fallbackData = [];
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Buscar si ya existe data para esta fecha
        const existingData = salesData.find((item: any) => 
          new Date(item.date).toDateString() === date.toDateString()
        );
        
        if (!existingData) {
          fallbackData.push({
            date: date.toISOString().split('T')[0],
            sales: 0,
            revenue: 0,
            tableRevenue: 0,
            inventoryRevenue: 0
          });
        }
      }
      
      // Combinar datos reales con datos de fallback
      salesData = [...salesData, ...fallbackData].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    }

    res.json({
      success: true,
      data: salesData,
      message: 'Reporte de ventas obtenido exitosamente'
    });

  } catch (error) {
    console.error('Error obteniendo reporte de ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener reporte de productos
export const getProductsReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!isDatabaseConnected()) {
    res.json({
      success: true,
      data: [],
      message: 'Reporte de productos (sin base de datos)'
    });
    return;
  }

  try {
    const { period } = req.query as any;
    
    let dateFilter = '';
    switch (period) {
      case 'day':
        dateFilter = 'AND DATE(s.created_at) = CURRENT_DATE';
        break;
      case 'week':
        dateFilter = 'AND s.created_at >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'month':
        dateFilter = 'AND s.created_at >= CURRENT_DATE - INTERVAL \'30 days\'';
        break;
      case 'year':
        dateFilter = 'AND s.created_at >= CURRENT_DATE - INTERVAL \'365 days\'';
        break;
      default:
        dateFilter = 'AND s.created_at >= CURRENT_DATE - INTERVAL \'30 days\'';
    }

    const productsQuery = `
      SELECT 
        p.id as product_id,
        p.name,
        p.category,
        COALESCE(SUM(si.quantity), 0) as quantity,
        COALESCE(SUM(si.quantity * si.unit_price), 0) as revenue,
        COALESCE(SUM(si.quantity * (si.unit_price - p.price * 0.6)), 0) as profit,
        CASE 
          WHEN SUM(si.quantity) > 0 THEN SUM(si.quantity * si.unit_price) / SUM(si.quantity)
          ELSE p.price
        END as average_price
      FROM products p
      LEFT JOIN sale_items si ON p.id = si.product_id
      LEFT JOIN sales s ON si.sale_id = s.id
      WHERE p.is_active = true ${dateFilter}
      GROUP BY p.id, p.name, p.category, p.price
      HAVING SUM(si.quantity) > 0
      ORDER BY revenue DESC
      LIMIT 20
    `;

    const result = await query(productsQuery);
    
    const productsData = result.rows.map((row: any) => ({
      productId: row.product_id,
      name: row.name,
      category: row.category,
      quantity: parseInt(row.quantity || 0),
      revenue: parseFloat(row.revenue || 0),
      profit: parseFloat(row.profit || 0),
      averagePrice: parseFloat(row.average_price || 0)
    }));

    res.json({
      success: true,
      data: productsData,
      message: 'Reporte de productos obtenido exitosamente'
    });

  } catch (error) {
    console.error('Error obteniendo reporte de productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener reporte de usuarios/empleados
export const getUsersReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!isDatabaseConnected()) {
    res.json({
      success: true,
      data: [],
      message: 'Reporte de usuarios (sin base de datos)'
    });
    return;
  }

  try {
    const { period } = req.query as any;
    
    let dateFilter = '';
    switch (period) {
      case 'day':
        dateFilter = 'AND DATE(created_at) = CURRENT_DATE';
        break;
      case 'week':
        dateFilter = 'AND created_at >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'month':
        dateFilter = 'AND created_at >= CURRENT_DATE - INTERVAL \'30 days\'';
        break;
      case 'year':
        dateFilter = 'AND created_at >= CURRENT_DATE - INTERVAL \'365 days\'';
        break;
      default:
        dateFilter = 'AND created_at >= CURRENT_DATE - INTERVAL \'30 days\'';
    }

    const usersQuery = `
      WITH user_sales AS (
        SELECT 
          u.id as user_id,
          u.name as name,
          u.role,
          COALESCE(COUNT(s.id), 0) as sales,
          COALESCE(SUM(s.total_amount), 0) as inventory_revenue
        FROM users u
        LEFT JOIN sales s ON u.id = s.user_id ${dateFilter.replace('created_at', 's.created_at')}
        WHERE u.is_active = true
        GROUP BY u.id, u.name, u.role
      ),
      user_sessions AS (
        SELECT 
          u.id as user_id,
          COALESCE(COUNT(ts.id), 0) as sessions_handled,
          COALESCE(SUM(ts.total_amount), 0) as table_revenue,
          COALESCE(AVG(EXTRACT(EPOCH FROM (ts.end_time - ts.start_time))/3600), 0) as avg_session_time
        FROM users u
        LEFT JOIN table_sessions ts ON u.id = ts.user_id 
        WHERE u.is_active = true AND ts.end_time IS NOT NULL ${dateFilter.replace('created_at', 'ts.end_time')}
        GROUP BY u.id
      )
      SELECT 
        us.user_id,
        us.name,
        us.role,
        us.sales,
        us.inventory_revenue,
        COALESCE(uss.table_revenue, 0) as table_revenue,
        (us.inventory_revenue + COALESCE(uss.table_revenue, 0)) as revenue,
        COALESCE(uss.sessions_handled, 0) as sessions_handled,
        COALESCE(uss.avg_session_time, 0) as average_session_time
      FROM user_sales us
      LEFT JOIN user_sessions uss ON us.user_id = uss.user_id
      WHERE (us.sales > 0 OR COALESCE(uss.sessions_handled, 0) > 0)
      ORDER BY revenue DESC
    `;

    const result = await query(usersQuery);
    
    const usersData = result.rows.map((row: any) => ({
      userId: row.user_id,
      name: row.name,
      role: row.role,
      sales: parseInt(row.sales || 0),
      revenue: parseFloat(row.revenue || 0),
      tableRevenue: parseFloat(row.table_revenue || 0),
      inventoryRevenue: parseFloat(row.inventory_revenue || 0),
      sessionsHandled: parseInt(row.sessions_handled || 0),
      averageSessionTime: parseFloat(row.average_session_time || 0)
    }));

    res.json({
      success: true,
      data: usersData,
      message: 'Reporte de usuarios obtenido exitosamente'
    });

  } catch (error) {
    console.error('Error obteniendo reporte de usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener reporte de mesas
export const getTablesReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!isDatabaseConnected()) {
    res.json({
      success: true,
      data: [],
      message: 'Reporte de mesas (sin base de datos)'
    });
    return;
  }

  try {
    const { period } = req.query as any;
    
    let dateFilter = '';
    switch (period) {
      case 'day':
        dateFilter = 'AND DATE(ts.end_time) = CURRENT_DATE';
        break;
      case 'week':
        dateFilter = 'AND ts.end_time >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'month':
        dateFilter = 'AND ts.end_time >= CURRENT_DATE - INTERVAL \'30 days\'';
        break;
      case 'year':
        dateFilter = 'AND ts.end_time >= CURRENT_DATE - INTERVAL \'365 days\'';
        break;
      default:
        dateFilter = 'AND ts.end_time >= CURRENT_DATE - INTERVAL \'30 days\'';
    }

    const tablesQuery = `
      SELECT 
        t.id as table_id,
        CONCAT('Mesa ', t.number) as table_name,
        COALESCE(SUM(EXTRACT(EPOCH FROM (ts.end_time - ts.start_time))/3600), 0) as hours,
        COALESCE(SUM(ts.total_amount), 0) as revenue,
        COALESCE(COUNT(ts.id), 0) as sessions,
        CASE 
          WHEN COUNT(ts.id) > 0 THEN AVG(EXTRACT(EPOCH FROM (ts.end_time - ts.start_time))/3600)
          ELSE 0
        END as average_session_time,
        CASE 
          WHEN '${period}' = 'day' THEN (COALESCE(SUM(EXTRACT(EPOCH FROM (ts.end_time - ts.start_time))/3600), 0) / 24) * 100
          WHEN '${period}' = 'week' THEN (COALESCE(SUM(EXTRACT(EPOCH FROM (ts.end_time - ts.start_time))/3600), 0) / (24 * 7)) * 100
          WHEN '${period}' = 'month' THEN (COALESCE(SUM(EXTRACT(EPOCH FROM (ts.end_time - ts.start_time))/3600), 0) / (24 * 30)) * 100
          ELSE (COALESCE(SUM(EXTRACT(EPOCH FROM (ts.end_time - ts.start_time))/3600), 0) / (24 * 365)) * 100
        END as occupancy_rate
      FROM tables t
      LEFT JOIN table_sessions ts ON t.id = ts.table_id AND ts.end_time IS NOT NULL ${dateFilter}
      WHERE t.is_active = true
      GROUP BY t.id, t.number
      HAVING COUNT(ts.id) > 0
      ORDER BY revenue DESC
    `;

    const result = await query(tablesQuery);
    
    const tablesData = result.rows.map((row: any) => ({
      tableId: row.table_id,
      tableName: row.table_name,
      hours: parseFloat(row.hours || 0),
      revenue: parseFloat(row.revenue || 0),
      sessions: parseInt(row.sessions || 0),
      averageSessionTime: parseFloat(row.average_session_time || 0),
      occupancyRate: Math.min(parseFloat(row.occupancy_rate || 0), 100)
    }));

    res.json({
      success: true,
      data: tablesData,
      message: 'Reporte de mesas obtenido exitosamente'
    });

  } catch (error) {
    console.error('Error obteniendo reporte de mesas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener reporte detallado de empleado (para cuadre de caja)
export const getEmployeeDetailedReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!isDatabaseConnected()) {
    res.json({
      success: true,
      data: {
        employeeId: 0,
        employeeName: 'Sin datos',
        role: 'employee',
        period: 'day',
        tablesSessions: [],
        inventorySales: [],
        totalTableRevenue: 0,
        totalInventoryRevenue: 0,
        totalRevenue: 0,
        totalHours: 0,
        totalSales: 0,
        averageSessionTime: 0
      },
      message: 'Reporte detallado de empleado (sin base de datos)'
    });
    return;
  }

  try {
    const { employeeId } = req.params;
    const { period } = req.query as any;
    
    let dateFilter = '';
    switch (period) {
      case 'day':
        dateFilter = 'AND DATE(created_at) = CURRENT_DATE';
        break;
      case 'week':
        dateFilter = 'AND created_at >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'month':
        dateFilter = 'AND created_at >= CURRENT_DATE - INTERVAL \'30 days\'';
        break;
      default:
        dateFilter = 'AND DATE(created_at) = CURRENT_DATE';
    }

    // Obtener información del empleado
    const employeeQuery = `
      SELECT id, name, role
      FROM users 
      WHERE id = $1 AND is_active = true
    `;
    const employeeResult = await query(employeeQuery, [employeeId]);
    
    if (employeeResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
      return;
    }

    const employee = employeeResult.rows[0];

    // Obtener sesiones de mesa del empleado
    const sessionsQuery = `
      SELECT 
        ts.id as session_id,
        ts.table_id,
        CONCAT('Mesa ', t.number) as table_name,
        ts.start_time,
        ts.end_time,
        EXTRACT(EPOCH FROM (ts.end_time - ts.start_time))/3600 as duration,
        ts.total_amount as amount
      FROM table_sessions ts
      JOIN tables t ON ts.table_id = t.id
      WHERE ts.user_id = $1 AND ts.end_time IS NOT NULL ${dateFilter.replace('created_at', 'ts.end_time')}
      ORDER BY ts.start_time DESC
    `;
    const sessionsResult = await query(sessionsQuery, [employeeId]);

    // Obtener ventas de inventario del empleado
    const salesQuery = `
      SELECT 
        s.id as sale_id,
        si.product_id,
        p.name as product_name,
        si.quantity,
        si.unit_price,
        (si.quantity * si.unit_price) as total_amount,
        s.created_at as sale_time
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN products p ON si.product_id = p.id
      WHERE s.user_id = $1 ${dateFilter.replace('created_at', 's.created_at')}
      ORDER BY s.created_at DESC
    `;
    const salesResult = await query(salesQuery, [employeeId]);

    // Calcular totales
    const totalTableRevenue = sessionsResult.rows.reduce((sum: number, row: any) => sum + parseFloat(row.amount || 0), 0);
    const totalInventoryRevenue = salesResult.rows.reduce((sum: number, row: any) => sum + parseFloat(row.total_amount || 0), 0);
    const totalHours = sessionsResult.rows.reduce((sum: number, row: any) => sum + parseFloat(row.duration || 0), 0);
    const averageSessionTime = sessionsResult.rows.length > 0 ? totalHours / sessionsResult.rows.length : 0;

    const detailedReport = {
      employeeId: parseInt(employeeId),
      employeeName: employee.name,
      role: employee.role,
      period: period || 'day',
      tablesSessions: sessionsResult.rows.map((row: any) => ({
        sessionId: row.session_id,
        tableId: row.table_id,
        tableName: row.table_name,
        startTime: row.start_time,
        endTime: row.end_time,
        duration: parseFloat(row.duration || 0),
        amount: parseFloat(row.amount || 0)
      })),
      inventorySales: salesResult.rows.map((row: any) => ({
        saleId: row.sale_id,
        productId: row.product_id,
        productName: row.product_name,
        quantity: parseInt(row.quantity || 0),
        unitPrice: parseFloat(row.unit_price || 0),
        totalAmount: parseFloat(row.total_amount || 0),
        saleTime: row.sale_time
      })),
      totalTableRevenue,
      totalInventoryRevenue,
      totalRevenue: totalTableRevenue + totalInventoryRevenue,
      totalHours,
      totalSales: salesResult.rows.length,
      averageSessionTime
    };

    res.json({
      success: true,
      data: detailedReport,
      message: 'Reporte detallado de empleado obtenido exitosamente'
    });

  } catch (error) {
    console.error('Error obteniendo reporte detallado de empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}); 