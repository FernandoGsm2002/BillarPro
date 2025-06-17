import { Request, Response } from 'express';
import { pool } from '../config/database';

export class ProductController {
  // Obtener todos los productos
  static async getAllProducts(req: Request, res: Response) {
    try {
      const result = await pool.query(`
        SELECT id, name, description, price, category, stock, min_stock as "minStock", 
               is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
        FROM products 
        WHERE is_active = true
        ORDER BY name ASC
      `);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error obteniendo productos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Crear nuevo producto
  static async createProduct(req: Request, res: Response) {
    try {
      const { name, description, price, category, stock, minStock } = req.body;

      if (!name || !price || stock === undefined || minStock === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Campos requeridos: name, price, stock, minStock'
        });
      }

      const result = await pool.query(`
        INSERT INTO products (name, description, price, category, stock, min_stock, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING id, name, description, price, category, stock, min_stock as "minStock", 
                  is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
      `, [name, description, price, category, stock, minStock]);

      return res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Producto creado exitosamente'
      });
    } catch (error) {
      console.error('Error creando producto:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar producto
  static async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, price, category, stock, minStock } = req.body;

      if (!name || !price || stock === undefined || minStock === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Campos requeridos: name, price, stock, minStock'
        });
      }

      const result = await pool.query(`
        UPDATE products 
        SET name = $1, description = $2, price = $3, category = $4, 
            stock = $5, min_stock = $6, updated_at = CURRENT_TIMESTAMP
        WHERE id = $7 AND is_active = true
        RETURNING id, name, description, price, category, stock, min_stock as "minStock", 
                  is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
      `, [name, description, price, category, stock, minStock, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      return res.json({
        success: true,
        data: result.rows[0],
        message: 'Producto actualizado exitosamente'
      });
    } catch (error) {
      console.error('Error actualizando producto:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Eliminar producto (soft delete)
  static async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await pool.query(`
        UPDATE products 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
        RETURNING id
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      return res.json({
        success: true,
        message: 'Producto eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error eliminando producto:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener producto por ID
  static async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await pool.query(`
        SELECT id, name, description, price, category, stock, min_stock as "minStock", 
               is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
        FROM products 
        WHERE id = $1 AND is_active = true
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      return res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error obteniendo producto:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
} 