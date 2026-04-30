import path from 'path';
import express, { type Express } from "express";
import cors, { type CorsOptions } from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { PrismaClient } from '@prisma/client';
import { createRouter } from './interfaces/http/routes';
import { errorHandler, notFoundHandler } from './infrastructure/middleware/errorHandler';
import { logger } from './shared/utils/logger';

function buildCorsOptions(): CorsOptions {
  const raw = process.env.CORS_ORIGIN ?? '';
  const allowed = raw.split(',').map(s => s.trim()).filter(Boolean);

  return {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowed.length === 0 || allowed.includes('*')) return callback(null, true);
      if (allowed.includes(origin)) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400,
  };
}

export function createApp(prisma: PrismaClient): Express {
  const app = express();
  const corsOptions = buildCorsOptions();

  app.options('*', cors(corsOptions));
  app.use(cors(corsOptions));
  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    skip: req => req.method === 'OPTIONS',
    message: { success: false, error: { code: 'RATE_LIMIT', message: 'Demasiadas solicitudes' } },
  }));

  try {
    const swaggerSpec = swaggerJsdoc({
      definition: {
        openapi: '3.0.0',
        info: { title: 'MediCare Medical API', version: '1.0.0' },
        servers: [{ url: `${process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3002}`}/api/v1` }],
        components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
        security: [{ bearerAuth: [] }],
      },
      apis: [
        path.join(__dirname, 'interfaces/http/routes/*.js'),
        path.join(__dirname, 'interfaces/http/routes/*.ts'),
      ],
    });
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));
  } catch {
    logger.warn('Swagger no disponible en este entorno');
  }
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'medical-service', timestamp: new Date().toISOString() }));
  app.use('/api/v1', createRouter(prisma));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
