import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de la base de datos PostgreSQL
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'billarea_db',
  password: process.env.DB_PASSWORD || 'fernandoxD113',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20, // máximo número de conexiones en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Pool de conexiones
export const pool = new Pool(dbConfig);

// Variable para controlar si la DB está conectada
let isConnected = false;

// Función para conectar a la base de datos
export const connectDB = async (): Promise<void> => {
  try {
    console.log('🔄 Intentando conectar a PostgreSQL...');
    console.log(`📍 Configuración: ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    
    const client = await pool.connect();
    console.log('✅ Conectado a PostgreSQL exitosamente');
    
    // Verificar la versión de PostgreSQL
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version.split(' ')[1]);
    
    // Probar una query simple para asegurar que todo funciona
    await client.query('SELECT 1');
    console.log('🔍 Verificación de consulta exitosa');
    
    client.release();
    isConnected = true;
    console.log('🎯 Estado de conexión establecido: CONECTADO');
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error);
    console.error('🔍 Detalles del error:', {
      code: (error as any).code,
      message: (error as any).message,
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user
    });
    console.log('⚠️  Continuando en modo desarrollo sin base de datos...');
    console.log('💡 Para usar todas las funciones, configura PostgreSQL:');
    console.log('   1. Instala PostgreSQL');
    console.log('   2. Crea la base de datos: CREATE DATABASE billarea_db;');
    console.log('   3. Configura la contraseña en backend/.env');
    
    isConnected = false;
    console.log('🎯 Estado de conexión establecido: DESCONECTADO');
    // No terminar el proceso, continuar sin DB para desarrollo
  }
};

// Función para desconectar de la base de datos
export const disconnectDB = async (): Promise<void> => {
  try {
    if (isConnected) {
      await pool.end();
      console.log('🔌 Desconectado de PostgreSQL');
    }
  } catch (error) {
    console.error('❌ Error desconectando de PostgreSQL:', error);
  }
};

// Función para ejecutar queries con manejo de errores
export const query = async (text: string, params?: any[]): Promise<any> => {
  if (!isConnected) {
    console.warn('⚠️  Base de datos no conectada. Retornando datos de prueba...');
    // Retornar datos de prueba para funciones básicas
    return {
      rows: [],
      rowCount: 0
    };
  }

  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    console.log('🔍 Query ejecutada:', {
      query: text,
      duration: `${duration}ms`,
      rows: result.rowCount
    });
    
    return result;
  } catch (error) {
    console.error('❌ Error en query:', {
      query: text,
      params,
      error: error
    });
    throw error;
  }
};

// Función para transacciones
export const transaction = async (callback: (client: any) => Promise<any>): Promise<any> => {
  if (!isConnected) {
    throw new Error('Base de datos no conectada');
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Función para verificar si la DB está conectada
export const isDatabaseConnected = (): boolean => {
  console.log(`🔍 Verificando estado de conexión: ${isConnected ? 'CONECTADO' : 'DESCONECTADO'}`);
  return isConnected;
};

export default pool; 