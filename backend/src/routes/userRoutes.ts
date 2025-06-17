import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/users
 * @desc    Obtener todos los usuarios
 * @access  Private (Admin)
 */
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Ruta de usuarios - En construcción'
  });
});

export default router; 