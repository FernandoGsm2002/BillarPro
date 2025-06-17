import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { TableController } from '../controllers/tableController';

const router = Router();

/**
 * @route   GET /api/tables
 * @desc    Obtener todas las mesas
 * @access  Private
 */
router.get('/', authenticateToken, TableController.getAllTables);

/**
 * @route   POST /api/tables
 * @desc    Crear nueva mesa
 * @access  Private (Admin)
 */
router.post('/', authenticateToken, TableController.createTable);

/**
 * @route   PUT /api/tables/:id
 * @desc    Actualizar mesa
 * @access  Private (Admin)
 */
router.put('/:id', authenticateToken, TableController.updateTable);

/**
 * @route   DELETE /api/tables/:id
 * @desc    Eliminar mesa
 * @access  Private (Admin)
 */
router.delete('/:id', authenticateToken, TableController.deleteTable);

/**
 * @route   PUT /api/tables/:id/status
 * @desc    Cambiar estado de una mesa
 * @access  Private
 */
router.put('/:id/status', authenticateToken, TableController.updateTableStatus);

/**
 * @route   GET /api/tables/stats
 * @desc    Obtener estadísticas de mesas
 * @access  Private
 */
router.get('/stats', authenticateToken, TableController.getTableStats);

/**
 * @route   GET /api/tables/occupied-numbers
 * @desc    Obtener números de mesa ocupados (para generar nuevo número)
 * @access  Private
 */
router.get('/occupied-numbers', authenticateToken, TableController.getOccupiedNumbers);

/**
 * @route   GET /api/tables/:id/session
 * @desc    Obtener sesión activa de una mesa
 * @access  Private
 */
router.get('/:id/session', authenticateToken, TableController.getTableSession);

/**
 * @route   POST /api/tables/:id/start
 * @desc    Iniciar sesión en una mesa
 * @access  Private
 */
router.post('/:id/start', authenticateToken, TableController.startTableSession);

/**
 * @route   POST /api/tables/:id/end
 * @desc    Finalizar sesión en una mesa
 * @access  Private
 */
router.post('/:id/end', authenticateToken, TableController.endTableSession);

export default router; 