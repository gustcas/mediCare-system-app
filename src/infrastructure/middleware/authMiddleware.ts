import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../../shared/errors/AppError';
import { JwtPayload, RequestUser } from '../../shared/types';

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Token no proporcionado'));
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = { id: payload.sub, email: payload.email, roles: payload.roles, permissions: payload.permissions };
    next();
  } catch {
    next(AppError.unauthorized('Token inválido o expirado'));
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(AppError.unauthorized());
    if (!req.user.roles.some(r => roles.includes(r))) return next(AppError.forbidden());
    next();
  };
}
