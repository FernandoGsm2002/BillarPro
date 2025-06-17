import { Request, Response } from 'express';
import { query, isDatabaseConnected } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { APIResponse } from '../types';

interface DashboardStats {
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

/**
 * Obtener estadísticas del dashboard
 */
export const getDashboardStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!isDatabaseConnected()) {
    // Datos limpios si no hay base de datos
    const cleanStats: DashboardStats = {
      totalTables: 8,
      activeTables: 0,
      totalRevenue: 0,
      todayRevenue: 0,
      totalSales: 0,
      todaySales: 0,
      lowStockProducts: 0,
      averageSessionTime: 0,
      occupancyRate: 0,
      totalProducts: 17,
      totalUsers: 6
    };

    res.json({
      success: true,
      data: cleanStats,
      message: 'Estadísticas del dashboard (sin base de datos)'
    } as APIResponse<DashboardStats>);
    return;
  }

  try {
    // Obtener estadísticas reales de la base de datos
    const stats: DashboardStats = {
      totalTables: 0,
      activeTables: 0,
      totalRevenue: 0,
      todayRevenue: 0,
      totalSales: 0,
      todaySales: 0,
      lowStockProducts: 0,
      averageSessionTime: 0,
      occupancyRate: 0,
      totalProducts: 0,
      totalUsers: 0
    };

    // 1. Total de mesas
    const tablesResult = await query('SELECT COUNT(*) as total FROM tables WHERE is_active = true');
    stats.totalTables = parseInt(tablesResult.rows[0]?.total || 0);

    // 2. Mesas activas (con sesiones en curso)
    const activeTablesResult = await query(`
      SELECT COUNT(DISTINCT table_id) as active 
      FROM table_sessions 
      WHERE end_time IS NULL
    `);
    stats.activeTables = parseInt(activeTablesResult.rows[0]?.active || 0);

    // 3. Total de productos
    const productsResult = await query('SELECT COUNT(*) as total FROM products WHERE is_active = true');
    stats.totalProducts = parseInt(productsResult.rows[0]?.total || 0);

    // 4. Total de usuarios
    const usersResult = await query('SELECT COUNT(*) as total FROM users WHERE is_active = true');
    stats.totalUsers = parseInt(usersResult.rows[0]?.total || 0);

    // 5. Productos con stock bajo (menos de 5)
    const lowStockResult = await query('SELECT COUNT(*) as low FROM products WHERE stock < 5 AND is_active = true');
    stats.lowStockProducts = parseInt(lowStockResult.rows[0]?.low || 0);

    // 6. Ingresos totales (ventas + sesiones de mesa)
    const totalRevenueResult = await query(`
      SELECT 
        COALESCE((SELECT SUM(total_amount) FROM sales), 0) +
        COALESCE((SELECT SUM(total_amount) FROM table_sessions WHERE end_time IS NOT NULL AND total_amount > 0), 0)
        as total
    `);
    stats.totalRevenue = parseFloat(totalRevenueResult.rows[0]?.total || 0);

    // 7. Ingresos de hoy (ventas + sesiones de mesa)
    const todayRevenueResult = await query(`
      SELECT 
        COALESCE((SELECT SUM(total_amount) FROM sales WHERE DATE(created_at) = CURRENT_DATE), 0) +
        COALESCE((SELECT SUM(total_amount) FROM table_sessions WHERE DATE(end_time) = CURRENT_DATE AND end_time IS NOT NULL AND total_amount > 0), 0)
        as today
    `);
    stats.todayRevenue = parseFloat(todayRevenueResult.rows[0]?.today || 0);

    // 8. Total de ventas
    const totalSalesResult = await query(`
      SELECT COUNT(*) as total 
      FROM sales
    `);
    stats.totalSales = parseInt(totalSalesResult.rows[0]?.total || 0);

    // 9. Ventas de hoy
    const todaySalesResult = await query(`
      SELECT COUNT(*) as today 
      FROM sales 
      WHERE DATE(created_at) = CURRENT_DATE
    `);
    stats.todaySales = parseInt(todaySalesResult.rows[0]?.today || 0);

    // 10. Tiempo promedio de sesión (en horas)
    const avgSessionResult = await query(`
      SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (end_time - start_time))/3600), 0) as avg_hours 
      FROM table_sessions 
      WHERE end_time IS NOT NULL
    `);
    stats.averageSessionTime = parseFloat(avgSessionResult.rows[0]?.avg_hours || 0);

    // 11. Tasa de ocupación
    if (stats.totalTables > 0) {
      stats.occupancyRate = (stats.activeTables / stats.totalTables) * 100;
    }

    res.json({
      success: true,
      data: stats,
      message: 'Estadísticas del dashboard obtenidas exitosamente'
    } as APIResponse<DashboardStats>);

  } catch (error) {
    console.error('Error obteniendo estadísticas del dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    } as APIResponse);
  }
});

/**
 * Obtener actividad reciente
 */
export const getRecentActivity = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!isDatabaseConnected()) {
    const cleanActivity: any[] = [];

    res.json({
      success: true,
      data: cleanActivity,
      message: 'Sin actividad reciente (sin base de datos)'
    } as APIResponse);
    return;
  }

  try {
    // Obtener actividad reciente real
    const recentSales = await query(`
      SELECT 
        s.id,
        'sale' as type,
        CASE 
          WHEN s.table_session_id IS NOT NULL THEN
            CONCAT('Venta completada - Mesa ', t.number)
          ELSE
            'Venta completada - Mostrador'
        END as description,
        s.total_amount as amount,
        s.created_at as timestamp
      FROM sales s
      LEFT JOIN table_sessions ts ON s.table_session_id = ts.id
      LEFT JOIN tables t ON ts.table_id = t.id
      ORDER BY s.created_at DESC
      LIMIT 10
    `);

    const recentSessions = await query(`
      SELECT 
        ts.id,
        'session' as type,
        CONCAT('Sesión ', 
          CASE WHEN ts.end_time IS NULL THEN 'iniciada' ELSE 'finalizada' END,
          ' - Mesa ', t.number
        ) as description,
        NULL as amount,
        ts.start_time as timestamp
      FROM table_sessions ts
      JOIN tables t ON ts.table_id = t.id
      ORDER BY ts.start_time DESC
      LIMIT 10
    `);

    // Combinar y ordenar actividades
    const activities = [
      ...recentSales.rows,
      ...recentSessions.rows
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
     .slice(0, 15);

    res.json({
      success: true,
      data: activities,
      message: 'Actividad reciente obtenida exitosamente'
    } as APIResponse);

  } catch (error) {
    console.error('Error obteniendo actividad reciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    } as APIResponse);
  }
}); 