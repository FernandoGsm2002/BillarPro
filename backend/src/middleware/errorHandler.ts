import { Request, Response, NextFunction } from 'express';

// Interfaz para errores personalizados
export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Middleware global de manejo de errores
 */
export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';

  // Log del error para debugging
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Errores específicos de PostgreSQL
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        statusCode = 409;
        message = 'Ya existe un registro con estos datos';
        break;
      case '23503': // foreign_key_violation
        statusCode = 400;
        message = 'Referencia a datos inexistentes';
        break;
      case '23502': // not_null_violation
        statusCode = 400;
        message = 'Faltan campos requeridos';
        break;
      case '22P02': // invalid_text_representation
        statusCode = 400;
        message = 'Formato de datos inválido';
        break;
      default:
        statusCode = 500;
        message = 'Error de base de datos';
    }
  }

  // Errores de validación
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Datos de entrada inválidos';
  }

  // Errores de JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  }

  // En producción, no mostrar detalles del error
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Error interno del servidor';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    })
  });
};

/**
 * Wrapper para funciones async para capturar errores automáticamente
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
}; 