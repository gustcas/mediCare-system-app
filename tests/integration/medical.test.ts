import 'dotenv/config';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app';

const prisma = new PrismaClient();
const app = createApp(prisma);

const adminToken = jwt.sign(
  { sub: 'test-admin-id', email: 'admin@test.com', roles: ['ADMIN'], permissions: ['patients:CREATE', 'patients:READ', 'doctors:CREATE', 'doctors:READ', 'appointments:CREATE', 'appointments:READ'] },
  process.env.JWT_SECRET || 'test_secret',
  { expiresIn: '1h' },
);

let patientId: string;
let doctorId: string;
let appointmentId: string;

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  if (appointmentId) await prisma.appointment.deleteMany({ where: { id: appointmentId } }).catch(() => {});
  if (patientId) await prisma.patient.deleteMany({ where: { id: patientId } }).catch(() => {});
  if (doctorId) await prisma.doctor.deleteMany({ where: { id: doctorId } }).catch(() => {});
  await prisma.$disconnect();
});

describe('Patients API', () => {
  const authHeader = () => ({ Authorization: `Bearer ${adminToken}` });

  it('GET /api/v1/patients should return list', async () => {
    const res = await request(app).get('/api/v1/patients').set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('items');
  });

  it('POST /api/v1/patients should create patient', async () => {
    const res = await request(app)
      .post('/api/v1/patients')
      .set(authHeader())
      .send({
        userId: '99999999-9999-9999-9999-999999999001',
        dateOfBirth: '1990-01-15',
        gender: 'MALE',
        bloodType: 'O_POS',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    patientId = res.body.data.id;
  });

  it('GET /api/v1/patients/:id should return patient', async () => {
    if (!patientId) return;
    const res = await request(app).get(`/api/v1/patients/${patientId}`).set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(patientId);
  });
});

describe('GET /health', () => {
  it('should return healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('medical-service');
  });
});

describe('Auth middleware', () => {
  it('should reject requests without token', async () => {
    const res = await request(app).get('/api/v1/patients');
    expect(res.status).toBe(401);
  });

  it('should reject invalid tokens', async () => {
    const res = await request(app).get('/api/v1/patients').set('Authorization', 'Bearer invalid_token');
    expect(res.status).toBe(401);
  });
});
