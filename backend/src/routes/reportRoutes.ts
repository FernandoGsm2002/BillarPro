import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getSalesReport,
  getProductsReport,
  getUsersReport,
  getTablesReport,
  getEmployeeDetailedReport
} from '../controllers/reportController';

const router = Router();

/**
 * @route   GET /api/reports/sales
 * @desc    Obtener reporte de ventas
 * @access  Private
 */
router.get('/sales', authenticateToken, getSalesReport);

/**
 * @route   GET /api/reports/products
 * @desc    Obtener reporte de productos
 * @access  Private
 */
router.get('/products', authenticateToken, getProductsReport);

/**
 * @route   GET /api/reports/users
 * @desc    Obtener reporte de usuarios/empleados
 * @access  Private
 */
router.get('/users', authenticateToken, getUsersReport);

/**
 * @route   GET /api/reports/tables
 * @desc    Obtener reporte de mesas
 * @access  Private
 */
router.get('/tables', authenticateToken, getTablesReport);

/**
 * @route   GET /api/reports/employee/:employeeId
 * @desc    Obtener reporte detallado de empleado para cuadre de caja
 * @access  Private
 */
router.get('/employee/:employeeId', authenticateToken, getEmployeeDetailedReport);

export default router; 