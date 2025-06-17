import { Request, Response } from 'express';
import { query, isDatabaseConnected, pool } from '../config/database';

export class TableController {
  // Obtener todas las mesas
  static async getAllTables(req: Request, res: Response) {
    try {
      console.log('🔍 getAllTables - Ejecutando query...');
      
      const result = await pool.query(`
        SELECT 
          t.id, 
          t.number, 
          t.type, 
          t.status, 
          t.hourly_rate as "hourlyRate",
          t.current_session_id as "currentSessionId",
          t.is_active as "isActive",
          t.created_at as "createdAt", 
          t.updated_at as "updatedAt",
          ts.start_time as "sessionStartTime"
        FROM tables t
        LEFT JOIN table_sessions ts ON t.current_session_id = ts.id AND ts.end_time IS NULL
        WHERE t.is_active = true
        ORDER BY t.number ASC
      `);

      console.log(`📊 Query ejecutada exitosamente, ${result.rows.length} mesas encontradas`);

      // Formatear los datos para el frontend
      const tables = result.rows.map(table => ({
        id: table.id,
        name: `Mesa ${table.number}`, // Usar number para el nombre
        type: table.type,
        status: table.status,
        hourlyRate: parseFloat(table.hourlyRate),
        description: `Mesa de ${table.type}`,
        currentSessionId: table.currentSessionId,
        sessionStartTime: table.sessionStartTime ? table.sessionStartTime.toISOString() : undefined,
        isActive: table.isActive,
        createdAt: table.createdAt,
        updatedAt: table.updatedAt
      }));

      console.log('✅ Datos formateados para frontend:', tables.map(t => `${t.name} (${t.type}, ${t.status})`));

      return res.json({
        success: true,
        data: tables
      });
          } catch (error: any) {
        console.error('❌ Error obteniendo mesas:', error);
        return res.status(500).json({
          success: false,
          message: 'Error interno del servidor',
          error: error.message
        });
      }
  }

  // Iniciar sesión en una mesa
  static async startTableSession(req: Request, res: Response) {
    const client = await pool.connect();
    
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId es requerido'
        });
      }

      await client.query('BEGIN');

      // Verificar que la mesa esté disponible
      const tableResult = await client.query(`
        SELECT id, number, status FROM tables WHERE id = $1
      `, [id]);

      if (tableResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Mesa no encontrada'
        });
      }

      const table = tableResult.rows[0];
      if (table.status !== 'available') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'La mesa no está disponible'
        });
      }

      // Crear nueva sesión
      const sessionResult = await client.query(`
        INSERT INTO table_sessions (table_id, user_id, start_time, status)
        VALUES ($1, $2, CURRENT_TIMESTAMP, 'active')
        RETURNING id, table_id as "tableId", user_id as "userId", 
                  start_time as "startTime", status
      `, [id, userId]);

      const sessionId = sessionResult.rows[0].id;

      // Actualizar estado de la mesa
      await client.query(`
        UPDATE tables 
        SET status = 'occupied', current_session_id = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [sessionId, id]);

      await client.query('COMMIT');

      return res.json({
        success: true,
        data: sessionResult.rows[0],
        message: 'Sesión iniciada exitosamente'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error iniciando sesión de mesa:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    } finally {
      client.release();
    }
  }

  // Finalizar sesión en una mesa
  static async endTableSession(req: Request, res: Response) {
    const client = await pool.connect();
    
    try {
      const { id } = req.params;
      const { totalAmount } = req.body;

      await client.query('BEGIN');

      // Verificar que la mesa esté ocupada
      const tableResult = await client.query(`
        SELECT id, number, status, current_session_id as "currentSessionId" 
        FROM tables WHERE id = $1
      `, [id]);

      if (tableResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Mesa no encontrada'
        });
      }

      const table = tableResult.rows[0];
      if (table.status !== 'occupied' || !table.currentSessionId) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'La mesa no tiene una sesión activa'
        });
      }

      // Finalizar la sesión
      const sessionResult = await client.query(`
        UPDATE table_sessions 
        SET end_time = CURRENT_TIMESTAMP, status = 'completed', total_amount = $1
        WHERE id = $2
        RETURNING id, table_id as "tableId", user_id as "userId", 
                  start_time as "startTime", end_time as "endTime", 
                  total_amount as "totalAmount", status
      `, [totalAmount || 0, table.currentSessionId]);

      // Actualizar estado de la mesa
      await client.query(`
        UPDATE tables 
        SET status = 'available', current_session_id = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [id]);

      await client.query('COMMIT');

      return res.json({
        success: true,
        data: sessionResult.rows[0],
        message: 'Sesión finalizada exitosamente'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error finalizando sesión de mesa:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    } finally {
      client.release();
    }
  }

  // Obtener sesión activa de una mesa
  static async getTableSession(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await pool.query(`
        SELECT ts.id, ts.table_id as "tableId", ts.user_id as "userId", 
               ts.start_time as "startTime", ts.end_time as "endTime",
               ts.total_amount as "totalAmount", ts.status,
               u.first_name as "userFirstName", u.last_name as "userLastName",
               t.number as "tableNumber"
        FROM table_sessions ts
        LEFT JOIN users u ON ts.user_id = u.id
        LEFT JOIN tables t ON ts.table_id = t.id
        WHERE ts.table_id = $1 AND ts.status = 'active'
        ORDER BY ts.start_time DESC
        LIMIT 1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No hay sesión activa para esta mesa'
        });
      }

      return res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error obteniendo sesión de mesa:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener estadísticas de mesas
  static async getTableStats(req: Request, res: Response) {
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_tables,
          COUNT(CASE WHEN status = 'available' THEN 1 END) as available_tables,
          COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_tables,
          COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_tables
        FROM tables
      `);

      return res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas de mesas:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener números de mesa ocupados (activas e inactivas)
  static async getOccupiedNumbers(req: Request, res: Response) {
    try {
      const result = await pool.query(`
        SELECT DISTINCT number 
        FROM tables 
        ORDER BY number ASC
      `);

      const occupiedNumbers = result.rows.map(row => row.number);

      return res.json({
        success: true,
        data: occupiedNumbers,
        message: 'Números ocupados obtenidos exitosamente'
      });
    } catch (error) {
      console.error('Error obteniendo números ocupados:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Crear nueva mesa
  static async createTable(req: Request, res: Response) {
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    try {
      const { name, type, hourlyRate, description } = req.body;

      console.log('📝 Creando mesa con datos:', { name, type, hourlyRate, description });

      if (!name || !type || !hourlyRate) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, tipo y precio por hora son requeridos'
        });
      }

      // Extraer número de mesa del nombre
      const numberMatch = name.match(/\d+/);
      const number = numberMatch ? parseInt(numberMatch[0]) : null;

      if (!number) {
        return res.status(400).json({
          success: false,
          message: 'El nombre debe contener un número (ej: Mesa 9)'
        });
      }

      const result = await query(`
        INSERT INTO tables (number, type, hourly_rate, status, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, 'available', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, number, type, hourly_rate as "hourlyRate", status, is_active as "isActive", 
                  created_at as "createdAt", updated_at as "updatedAt"
      `, [number, type, hourlyRate]);

      const newTable = {
        ...result.rows[0],
        name: `Mesa ${result.rows[0].number}`,
        description: `Mesa de ${result.rows[0].type}`
      };

      console.log('✅ Mesa creada exitosamente:', newTable);

      return res.status(201).json({
        success: true,
        data: newTable,
        message: 'Mesa creada exitosamente'
      });
    } catch (error: any) {
      console.error('Error creando mesa:', error);
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({
          success: false,
          message: 'Ya existe una mesa con ese número'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor: ' + error.message
      });
    }
  }

  // Actualizar mesa
  static async updateTable(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, type, hourlyRate, description } = req.body;

      if (!name || !type || !hourlyRate) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, tipo y precio por hora son requeridos'
        });
      }

      // Extraer número de mesa del nombre
      const numberMatch = name.match(/\d+/);
      const number = numberMatch ? parseInt(numberMatch[0]) : null;

      if (!number) {
        return res.status(400).json({
          success: false,
          message: 'El nombre debe contener un número (ej: Mesa 9)'
        });
      }

      const result = await pool.query(`
        UPDATE tables 
        SET number = $1, type = $2, hourly_rate = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4 AND is_active = true
        RETURNING id, number, type, hourly_rate as "hourlyRate", status, is_active as "isActive", 
                  created_at as "createdAt", updated_at as "updatedAt"
      `, [number, type, hourlyRate, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Mesa no encontrada'
        });
      }

      const updatedTable = {
        ...result.rows[0],
        name: `Mesa ${result.rows[0].number}`,
        description: `Mesa de ${result.rows[0].type}`
      };

      return res.json({
        success: true,
        data: updatedTable,
        message: 'Mesa actualizada exitosamente'
      });
    } catch (error: any) {
      console.error('Error actualizando mesa:', error);
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({
          success: false,
          message: 'Ya existe una mesa con ese número'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Eliminar mesa
  static async deleteTable(req: Request, res: Response) {
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    try {
      const { id } = req.params;

      console.log('🗑️ Eliminando mesa con ID:', id);

      // Verificar si la mesa está ocupada
      const tableCheck = await query(`
        SELECT status FROM tables WHERE id = $1 AND is_active = true
      `, [id]);

      if (tableCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Mesa no encontrada'
        });
      }

      if (tableCheck.rows[0].status === 'occupied') {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar una mesa ocupada'
        });
      }

      // Eliminación lógica
      const result = await query(`
        UPDATE tables 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id
      `, [id]);

      console.log('✅ Mesa eliminada exitosamente, ID:', result.rows[0].id);

      return res.json({
        success: true,
        data: { id: result.rows[0].id },
        message: 'Mesa eliminada exitosamente'
      });
    } catch (error: any) {
      console.error('Error eliminando mesa:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor: ' + error.message
      });
    }
  }

  // Actualizar estado de mesa
  static async updateTableStatus(req: Request, res: Response) {
    const client = await pool.connect();
    
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Estado es requerido'
        });
      }

      await client.query('BEGIN');

      // Verificar que la mesa existe
      const tableCheck = await client.query(`
        SELECT id, status, current_session_id FROM tables WHERE id = $1 AND is_active = true
      `, [id]);

      if (tableCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Mesa no encontrada'
        });
      }

      const currentTable = tableCheck.rows[0];

      if (status === 'occupied') {
        // Iniciar sesión
        const sessionResult = await client.query(`
          INSERT INTO table_sessions (table_id, user_id, start_time)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
          RETURNING id, start_time as "startTime"
        `, [id, req.user?.userId || 1]); // Usar usuario actual o default

        const sessionId = sessionResult.rows[0].id;
        const startTime = sessionResult.rows[0].startTime;

        // Actualizar mesa
        await client.query(`
          UPDATE tables 
          SET status = $1, current_session_id = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [status, sessionId, id]);

        await client.query('COMMIT');

        return res.json({
          success: true,
          data: { 
            id: parseInt(id), 
            status, 
            currentSessionId: sessionId,
            sessionStartTime: startTime.toISOString()
          },
          message: 'Sesión iniciada exitosamente'
        });

      } else if (status === 'available' && currentTable.status === 'occupied') {
        // Finalizar sesión
        if (currentTable.current_session_id) {
          // Obtener datos de la sesión y mesa para calcular el total
          const sessionData = await client.query(`
            SELECT ts.id, ts.start_time, ts.table_id, ts.user_id, t.hourly_rate, t.number
            FROM table_sessions ts
            JOIN tables t ON ts.table_id = t.id
            WHERE ts.id = $1
          `, [currentTable.current_session_id]);

          if (sessionData.rows.length > 0) {
            const session = sessionData.rows[0];
            const startTime = new Date(session.start_time);
            const endTime = new Date();
            const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
            const totalAmount = Math.round(durationHours * session.hourly_rate * 100) / 100; // Redondear a 2 decimales

            // Finalizar sesión con el total calculado
            await client.query(`
              UPDATE table_sessions 
              SET end_time = CURRENT_TIMESTAMP, total_amount = $1
              WHERE id = $2
            `, [totalAmount, currentTable.current_session_id]);

            console.log(`💰 Sesión finalizada: S/ ${totalAmount} - Mesa ${session.number} - Duración: ${durationHours.toFixed(2)}h`);
          }
        }

        // Actualizar mesa
        await client.query(`
          UPDATE tables 
          SET status = $1, current_session_id = NULL, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [status, id]);

        await client.query('COMMIT');

        return res.json({
          success: true,
          data: { 
            id: parseInt(id), 
            status,
            currentSessionId: undefined,
            sessionStartTime: undefined
          },
          message: 'Sesión finalizada exitosamente'
        });

      } else {
        // Cambio de estado simple (reserved, maintenance, etc.)
        await client.query(`
          UPDATE tables 
          SET status = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [status, id]);

        await client.query('COMMIT');

        return res.json({
          success: true,
          data: { 
            id: parseInt(id), 
            status 
          },
          message: 'Estado actualizado exitosamente'
        });
      }

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error actualizando estado de mesa:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    } finally {
      client.release();
    }
  }
} 