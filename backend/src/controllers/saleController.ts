import { Request, Response } from 'express';
import { pool } from '../config/database';

export class SaleController {
  // Obtener todas las ventas
  static async getAllSales(req: Request, res: Response) {
    try {
      const result = await pool.query(`
        SELECT s.id, s.user_id as "userId", s.total_amount as "totalAmount", 
               s.payment_method as "paymentMethod", s.created_at as "createdAt",
               u.first_name as "userFirstName", u.last_name as "userLastName"
        FROM sales s
        LEFT JOIN users u ON s.user_id = u.id
        ORDER BY s.created_at DESC
      `);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error obteniendo ventas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Crear nueva venta
  static async createSale(req: Request, res: Response) {
    const client = await pool.connect();
    
    try {
      const { userId, totalAmount, paymentMethod, items } = req.body;

      if (!userId || !totalAmount || !paymentMethod || !items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Campos requeridos: userId, totalAmount, paymentMethod, items'
        });
      }

      await client.query('BEGIN');

      // Crear la venta
      const saleResult = await client.query(`
        INSERT INTO sales (user_id, total_amount, payment_method)
        VALUES ($1, $2, $3)
        RETURNING id, user_id as "userId", total_amount as "totalAmount", 
                  payment_method as "paymentMethod", created_at as "createdAt"
      `, [userId, totalAmount, paymentMethod]);

      const saleId = saleResult.rows[0].id;

      // Crear los items de la venta y actualizar stock
      for (const item of items) {
        // Verificar stock disponible
        const stockCheck = await client.query(`
          SELECT stock FROM products WHERE id = $1
        `, [item.productId]);

        if (stockCheck.rows.length === 0) {
          throw new Error(`Producto con ID ${item.productId} no encontrado`);
        }

        if (stockCheck.rows[0].stock < item.quantity) {
          throw new Error(`Stock insuficiente para el producto ID ${item.productId}`);
        }

        // Insertar item de venta
        await client.query(`
          INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price)
          VALUES ($1, $2, $3, $4, $5)
        `, [saleId, item.productId, item.quantity, item.unitPrice, item.totalPrice]);

        // Actualizar stock del producto
        await client.query(`
          UPDATE products 
          SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [item.quantity, item.productId]);
      }

      await client.query('COMMIT');

      return res.status(201).json({
        success: true,
        data: saleResult.rows[0],
        message: 'Venta creada exitosamente'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creando venta:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error interno del servidor'
      });
    } finally {
      client.release();
    }
  }

  // Obtener detalles de una venta
  static async getSaleById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Obtener la venta
      const saleResult = await pool.query(`
        SELECT s.id, s.user_id as "userId", s.total_amount as "totalAmount", 
               s.payment_method as "paymentMethod", s.created_at as "createdAt",
               u.first_name as "userFirstName", u.last_name as "userLastName"
        FROM sales s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.id = $1
      `, [id]);

      if (saleResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Venta no encontrada'
        });
      }

      // Obtener los items de la venta
      const itemsResult = await pool.query(`
        SELECT si.id, si.product_id as "productId", si.quantity, si.unit_price as "unitPrice", 
               si.total_price as "totalPrice", p.name as "productName"
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = $1
      `, [id]);

      const sale = {
        ...saleResult.rows[0],
        items: itemsResult.rows
      };

      return res.json({
        success: true,
        data: sale
      });
    } catch (error) {
      console.error('Error obteniendo venta:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener estadísticas de ventas
  static async getSalesStats(req: Request, res: Response) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const statsResult = await pool.query(`
        SELECT 
          COUNT(*) as total_sales,
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COUNT(CASE WHEN DATE(created_at) = $1 THEN 1 END) as today_sales,
          COALESCE(SUM(CASE WHEN DATE(created_at) = $1 THEN total_amount ELSE 0 END), 0) as today_revenue
        FROM sales
      `, [today]);

      res.json({
        success: true,
        data: statsResult.rows[0]
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas de ventas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
} 