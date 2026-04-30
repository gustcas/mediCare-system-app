import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app';

const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(`[medical-service] Variable de entorno requerida no definida: ${key}`);
  }
}

const g = globalThis as typeof globalThis & { _prisma?: PrismaClient };
const prisma = g._prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
g._prisma = prisma;

const app = createApp(prisma);
export default app;
