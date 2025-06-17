import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/inventory
 * @desc    Obtener movimientos de inventario
 * @access  Private
 */
router.get('/', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Ruta de inventario - En construcción'
  });
});

export default router; 