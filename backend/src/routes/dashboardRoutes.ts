import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getDashboardStats, getRecentActivity } from '../controllers/dashboardController';

const router = Router();

/**
 * @route   GET /api/dashboard/stats
 * @desc    Obtener estadísticas del dashboard
 * @access  Private
 */
router.get('/stats', authenticateToken, getDashboardStats);

/**
 * @route   GET /api/dashboard/activity
 * @desc    Obtener actividad reciente
 * @access  Private
 */
router.get('/activity', authenticateToken, getRecentActivity);

export default router; 