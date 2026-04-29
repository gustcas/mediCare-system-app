import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../shared/errors/AppError';
import { logger } from '../../shared/utils/logger';
import { errorResponse } from '../../shared/types';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.code, err.message, err.details));
    return;
  }
  if (err instanceof ZodError) {
    const details = err.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
    res.status(422).json(errorResponse('VALIDATION_ERROR', 'Error de validación', details));
    return;
  }
  logger.error('Unhandled error', { error: err, url: req.url });
  res.status(500).json(errorResponse('INTERNAL_ERROR', 'Error interno'));
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(errorResponse('NOT_FOUND', `Ruta no encontrada: ${req.method} ${req.url}`));
}
