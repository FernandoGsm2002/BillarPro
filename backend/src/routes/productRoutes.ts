import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { ProductController } from '../controllers/productController';

const router = Router();

/**
 * @route   GET /api/products
 * @desc    Obtener todos los productos
 * @access  Private
 */
router.get('/', authenticateToken, ProductController.getAllProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Obtener producto por ID
 * @access  Private
 */
router.get('/:id', authenticateToken, ProductController.getProductById);

/**
 * @route   POST /api/products
 * @desc    Crear nuevo producto
 * @access  Private
 */
router.post('/', authenticateToken, ProductController.createProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Actualizar producto
 * @access  Private
 */
router.put('/:id', authenticateToken, ProductController.updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Eliminar producto (soft delete)
 * @access  Private
 */
router.delete('/:id', authenticateToken, ProductController.deleteProduct);

export default router; 