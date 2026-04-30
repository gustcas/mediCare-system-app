import express, { type Express } from "express";
import cors from 'cors';
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

export function createApp(prisma: PrismaClient): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*', credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

  const swaggerSpec = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: { title: 'MediCare Medical API', version: '1.0.0' },
      servers: [{ url: `http://localhost:${process.env.PORT || 3002}/api/v1` }],
      components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
      security: [{ bearerAuth: [] }],
    },
    apis: ['./src/interfaces/http/routes/*.ts'],
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'medical-service', timestamp: new Date().toISOString() }));
  app.use('/api/v1', createRouter(prisma));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
