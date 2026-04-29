import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.printf(({ level, message, timestamp: ts, stack, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `${ts} [${level}] ${stack || message}${metaStr}`;
    }),
  ),
  transports: [new transports.Console()],
});
