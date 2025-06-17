import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload, UserRole } from '../types';
import { isDatabaseConnected } from '../config/database';

// Extender Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware para verificar JWT token
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Token de acceso requerido'
    });
    return;
  }

  // Si es un token offline y la base de datos no está conectada, permitir acceso
  if (token.startsWith('offline-token-') && !isDatabaseConnected()) {
    // Crear un usuario mock para modo offline
    req.user = {
      userId: 1,
      username: 'admin',
      role: UserRole.ADMIN
    };
    next();
    return;
  }

  // Si es un token offline pero la base de datos SÍ está conectada, generar un token real
  if (token.startsWith('offline-token-') && isDatabaseConnected()) {
    // Generar un token real para admin
    const secret = process.env.JWT_SECRET || 'billarea_secret_key';
    const realToken = jwt.sign(
      {
        userId: 1,
        username: 'admin',
        role: UserRole.ADMIN
      },
      secret,
      { expiresIn: '7d' }
    );
    
    // Devolver el token real para que el cliente lo use
    res.status(200).json({
      success: true,
      data: { token: realToken },
      message: 'Token actualizado'
    });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'billarea_secret_key';
    const decoded = jwt.verify(token, secret) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Token inválido o expirado'
    });
    return;
  }
};

/**
 * Middleware para verificar rol de administrador
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
    return;
  }

  if (req.user.role !== UserRole.ADMIN) {
    res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador'
    });
    return;
  }

  next();
};

/**
 * Middleware para verificar que el usuario puede acceder solo a sus datos
 * o es administrador
 */
export const requireOwnershipOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
  }

  const userId = parseInt(req.params.userId);
  
  // Admin puede acceder a todo
  if (req.user.role === UserRole.ADMIN) {
    return next();
  }

  // Usuario solo puede acceder a sus propios datos
  if (req.user.userId === userId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Acceso denegado. Solo puedes acceder a tus propios datos'
  });
}; 