import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createApp } from './app';
import { logger } from './shared/utils/logger';

const prisma = new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'] });
const PORT = parseInt(process.env.PORT || '3002', 10);
const app = createApp(prisma);

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info('Database connected');
    const server = app.listen(PORT, () => {
      logger.info(`Medical Service running on port ${PORT}`);
      logger.info(`Swagger: http://localhost:${PORT}/api-docs`);
    });
    const shutdown = async () => {
      server.close(async () => { await prisma.$disconnect(); process.exit(0); });
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    logger.error('Startup failed', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
