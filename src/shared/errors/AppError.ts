export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static unauthorized(msg = 'No autorizado') { return new AppError(msg, 401, 'UNAUTHORIZED'); }
  static forbidden(msg = 'Acceso denegado') { return new AppError(msg, 403, 'FORBIDDEN'); }
  static notFound(msg = 'No encontrado') { return new AppError(msg, 404, 'NOT_FOUND'); }
  static conflict(msg: string) { return new AppError(msg, 409, 'CONFLICT'); }
  static unprocessable(msg: string, details?: unknown) { return new AppError(msg, 422, 'UNPROCESSABLE', details); }
  static internal(msg = 'Error interno') { return new AppError(msg, 500, 'INTERNAL_ERROR'); }
}
