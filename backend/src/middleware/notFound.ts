import { Request, Response } from 'express';

/**
 * Middleware para manejar rutas no encontradas (404)
 */
export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
}; 