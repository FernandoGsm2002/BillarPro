const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'postgres', // Conectar a postgres para crear la DB
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432'),
};

const targetDbName = process.env.DB_NAME || 'billarea_db';

async function initializeDatabase() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🚀 Iniciando configuración de base de datos...');
    
    // 1. Verificar si la base de datos existe
    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
    const dbExists = await pool.query(checkDbQuery, [targetDbName]);
    
    if (dbExists.rows.length === 0) {
      // 2. Crear la base de datos si no existe
      console.log(`📊 Creando base de datos: ${targetDbName}`);
      await pool.query(`CREATE DATABASE ${targetDbName}`);
      console.log('✅ Base de datos creada exitosamente');
    } else {
      console.log(`📊 Base de datos ${targetDbName} ya existe`);
      
      // Preguntar si quiere reinicializar
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise((resolve) => {
        rl.question('¿Desea reinicializar la base de datos? (s/N): ', resolve);
      });
      
      rl.close();
      
      if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'si') {
        console.log('🗑️  Eliminando base de datos existente...');
        await pool.query(`DROP DATABASE ${targetDbName}`);
        console.log('📊 Recreando base de datos...');
        await pool.query(`CREATE DATABASE ${targetDbName}`);
        console.log('✅ Base de datos recreada exitosamente');
      } else {
        console.log('⏭️  Saltando creación de base de datos');
        await pool.end();
        return;
      }
    }
    
    await pool.end();
    
    // 3. Conectar a la nueva base de datos
    const targetPool = new Pool({
      ...dbConfig,
      database: targetDbName
    });
    
    // 4. Ejecutar script de inicialización
    console.log('📋 Ejecutando script de inicialización...');
    const initSqlPath = path.join(__dirname, '../../database/init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    
    await targetPool.query(initSql);
    console.log('✅ Tablas y estructuras creadas exitosamente');
    
    // 5. Ejecutar script de datos de prueba
    console.log('📋 Insertando datos de prueba...');
    const seedSqlPath = path.join(__dirname, '../../database/seed.sql');
    const seedSql = fs.readFileSync(seedSqlPath, 'utf8');
    
    await targetPool.query(seedSql);
    console.log('✅ Datos de prueba insertados exitosamente');
    
    await targetPool.end();
    
    console.log('🎉 ¡Base de datos inicializada completamente!');
    console.log('');
    console.log('📝 Usuarios creados:');
    console.log('   - admin / admin123 (Administrador)');
    console.log('   - juan_m / admin123 (Empleado - Mañana)');
    console.log('   - maria_t / admin123 (Empleado - Tarde)');
    console.log('   - carlos_n / admin123 (Empleado - Noche)');
    console.log('   - ana_ft / admin123 (Empleado - Tiempo Completo)');
    console.log('');
    console.log('🎱 Mesas: 8 mesas (4 Pool, 2 Snooker, 2 Billar)');
    console.log('📦 Productos: 17 productos en inventario');
    console.log('💰 Ingresos: S/ 0.00 (sistema limpio)');
    console.log('');
    console.log('🚀 ¡Listo para comenzar a operar! Ejecuta npm run dev para iniciar el servidor');
    
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase }; 