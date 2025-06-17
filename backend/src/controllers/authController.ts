import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, isDatabaseConnected } from '../config/database';
import { LoginRequest, AuthResponse, APIResponse, User, UserRole } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

// Usuarios de prueba para desarrollo (cuando no hay DB)
const testUsers = [
  {
    id: 1,
    username: 'admin',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'admin' as const,
    name: 'Administrador',
    shift: 'full' as const,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    username: 'juan_m',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'employee' as const,
    name: 'Juan Martínez',
    shift: 'morning' as const,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  }
];

/**
 * Login de usuario
 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username, password }: LoginRequest = req.body;

  // Validaciones básicas
  if (!username || !password) {
    res.status(400).json({
      success: false,
      message: 'Usuario y contraseña son requeridos'
    } as APIResponse);
    return;
  }

  let user: any = null;

  if (isDatabaseConnected()) {
    // Buscar usuario en la base de datos
    const result = await query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      } as APIResponse);
      return;
    }

    user = result.rows[0];
  } else {
    // Modo desarrollo - usar usuarios de prueba
    console.log('🔧 Usando usuarios de prueba (modo desarrollo)');
    user = testUsers.find(u => u.username === username);
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas. Usuarios disponibles: admin, juan_m'
      } as APIResponse);
      return;
    }
  }

  // Verificar contraseña
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    res.status(401).json({
      success: false,
      message: 'Credenciales inválidas'
    } as APIResponse);
    return;
  }

  // Generar JWT token
  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role
    },
    process.env.JWT_SECRET || 'billarea_secret_key',
    { expiresIn: '7d' }
  );

  // Preparar respuesta (sin contraseña)
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
      token
    } as AuthResponse,
    message: 'Login exitoso'
  } as APIResponse<AuthResponse>);
});

/**
 * Obtener perfil del usuario actual
 */
export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    } as APIResponse);
    return;
  }

  let userProfile: any = null;

  if (isDatabaseConnected()) {
    // Obtener datos actualizados del usuario
    const result = await query(
      'SELECT id, username, role, name, shift, is_active, created_at, updated_at FROM users WHERE id = $1',
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      } as APIResponse);
      return;
    }

    userProfile = result.rows[0];
  } else {
    // Modo desarrollo - usar usuarios de prueba
    const user = testUsers.find(u => u.id === req.user!.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      } as APIResponse);
      return;
    }
    const { password: _, ...userWithoutPassword } = user;
    userProfile = userWithoutPassword;
  }

  res.json({
    success: true,
    data: userProfile,
    message: 'Perfil obtenido exitosamente'
  } as APIResponse);
});

/**
 * Cambiar contraseña
 */
export const changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!isDatabaseConnected()) {
    res.status(503).json({
      success: false,
      message: 'Función no disponible sin base de datos'
    } as APIResponse);
    return;
  }

  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    } as APIResponse);
    return;
  }

  const { currentPassword, newPassword } = req.body;

  // Validaciones básicas
  if (!currentPassword || !newPassword) {
    res.status(400).json({
      success: false,
      message: 'Contraseña actual y nueva contraseña son requeridas'
    } as APIResponse);
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({
      success: false,
      message: 'La nueva contraseña debe tener al menos 6 caracteres'
    } as APIResponse);
    return;
  }

  // Obtener contraseña actual del usuario
  const userResult = await query(
    'SELECT password FROM users WHERE id = $1',
    [req.user!.userId]
  );

  if (userResult.rows.length === 0) {
    res.status(404).json({
      success: false,
      message: 'Usuario no encontrado'
    } as APIResponse);
    return;
  }

  // Verificar contraseña actual
  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword, 
    userResult.rows[0].password
  );

  if (!isCurrentPasswordValid) {
    res.status(400).json({
      success: false,
      message: 'Contraseña actual incorrecta'
    } as APIResponse);
    return;
  }

  // Hashear nueva contraseña
  const saltRounds = 10;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  // Actualizar contraseña en la base de datos
  await query(
    'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [hashedNewPassword, req.user!.userId]
  );

  res.json({
    success: true,
    message: 'Contraseña cambiada exitosamente'
  } as APIResponse);
});

/**
 * Verificar token (middleware como endpoint)
 */
export const verifyToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    } as APIResponse);
    return;
  }

  res.json({
    success: true,
    data: {
      userId: req.user!.userId,
      username: req.user!.username,
      role: req.user!.role,
      databaseConnected: isDatabaseConnected()
    },
    message: 'Token válido'
  } as APIResponse);
});

/**
 * Logout (opcional - principalmente para limpiar logs)
 */
export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // En este caso, el logout es principalmente del lado del cliente
  // pero podemos registrar el evento para logs/auditoría
  
  if (req.user) {
    console.log(`👋 Usuario ${req.user.username} (ID: ${req.user.userId}) cerró sesión`);
  }

  res.json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  } as APIResponse);
});

// Función auxiliar para generar hash de contraseña (para seeders/utilidades)
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}; 