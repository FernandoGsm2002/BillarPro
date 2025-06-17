import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { SaleController } from '../controllers/saleController';

const router = Router();

/**
 * @route   GET /api/sales
 * @desc    Obtener todas las ventas
 * @access  Private
 */
router.get('/', authenticateToken, SaleController.getAllSales);

/**
 * @route   GET /api/sales/stats
 * @desc    Obtener estadísticas de ventas
 * @access  Private
 */
router.get('/stats', authenticateToken, SaleController.getSalesStats);

/**
 * @route   GET /api/sales/:id
 * @desc    Obtener detalles de una venta
 * @access  Private
 */
router.get('/:id', authenticateToken, SaleController.getSaleById);

/**
 * @route   POST /api/sales
 * @desc    Crear nueva venta
 * @access  Private
 */
router.post('/', authenticateToken, SaleController.createSale);

export default router; 