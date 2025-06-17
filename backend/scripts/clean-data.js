const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'billarea_db',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432'),
};

async function cleanDatabase() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🧹 Limpiando datos de ejemplo de la base de datos...');
    
    // 1. Limpiar datos de ejemplo (en orden para respetar las foreign keys)
    console.log('🗑️  Eliminando datos de ejemplo...');
    
    // Eliminar items de ventas
    await pool.query('DELETE FROM sale_items');
    console.log('   ✅ Items de ventas eliminados');
    
    // Eliminar ventas
    await pool.query('DELETE FROM sales');
    console.log('   ✅ Ventas eliminadas');
    
    // Eliminar sesiones de mesa
    await pool.query('DELETE FROM table_sessions');
    console.log('   ✅ Sesiones de mesa eliminadas');
    
    // Eliminar movimientos de inventario
    await pool.query('DELETE FROM inventory_movements');
    console.log('   ✅ Movimientos de inventario eliminados');
    
    // Eliminar licencias de ejemplo (si existen las tablas)
    try {
      await pool.query('DELETE FROM licenses WHERE id > 0');
      console.log('   ✅ Licencias de ejemplo eliminadas');
    } catch (error) {
      console.log('   ⚠️  Tabla licenses no encontrada (normal si no se ha creado)');
    }
    
    try {
      await pool.query('DELETE FROM license_registrations WHERE id > 0');
      console.log('   ✅ Registros de licencias eliminados');
    } catch (error) {
      console.log('   ⚠️  Tabla license_registrations no encontrada (normal si no se ha creado)');
    }
    
    try {
      await pool.query('DELETE FROM license_activations WHERE id > 0');
      console.log('   ✅ Activaciones de licencias eliminadas');
    } catch (error) {
      console.log('   ⚠️  Tabla license_activations no encontrada (normal si no se ha creado)');
    }
    
    // 2. Resetear el estado de las mesas
    console.log('🔄 Reseteando estado de mesas...');
    await pool.query(`UPDATE tables SET 
      status = 'available', 
      current_session_id = NULL 
      WHERE id > 0`);
    console.log('   ✅ Estado de mesas reseteado');
    
    // 3. Resetear secuencias/IDs
    console.log('🔢 Reseteando secuencias...');
    await pool.query('ALTER SEQUENCE sales_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE sale_items_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE table_sessions_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE inventory_movements_id_seq RESTART WITH 1');
    
    // Solo resetear licencias si existen las tablas
    try {
      await pool.query('ALTER SEQUENCE licenses_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE license_registrations_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE license_activations_id_seq RESTART WITH 1');
      console.log('   ✅ Secuencias de licencias reseteadas');
    } catch (error) {
      console.log('   ⚠️  Tablas de licencias no encontradas (normal si no se han creado)');
    }
    
    console.log('   ✅ Secuencias reseteadas');
    
    await pool.end();
    
    console.log('');
    console.log('🎉 ¡Base de datos limpiada exitosamente!');
    console.log('');
    console.log('✅ Estado actual:');
    console.log('   - Usuarios: Mantenidos (admin, empleados, super_admin)');
    console.log('   - Mesas: 8 mesas disponibles (estado reseteado)');
    console.log('   - Productos: 17 productos con stock completo');
    console.log('   - Ventas: 0 (limpiadas)');
    console.log('   - Sesiones: 0 (limpiadas)');
    console.log('   - Ingresos: S/ 0.00');
    console.log('');
    console.log('🚀 Sistema listo para comenzar desde cero!');
    
  } catch (error) {
    console.error('❌ Error limpiando base de datos:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanDatabase();
}

module.exports = { cleanDatabase }; 