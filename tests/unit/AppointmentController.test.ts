import { AppointmentController } from '../../src/interfaces/http/controllers/AppointmentController';
import { AppError } from '../../src/shared/errors/AppError';

const mockPrisma = {
  appointment: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  doctor: { findUnique: jest.fn() },
} as any;

const mockRes = () => {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  return res;
};

const mockReq = (overrides = {}) => ({
  query: {},
  params: {},
  body: {},
  user: { id: 'user-1', email: 'test@test.com', roles: ['ADMIN'], permissions: [] },
  ...overrides,
} as any);

describe('AppointmentController.create', () => {
  let controller: AppointmentController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AppointmentController(mockPrisma);
  });

  it('should create appointment when doctor is available', async () => {
    const req = mockReq({
      body: {
        patientId: '00000000-0000-0000-0000-000000000001',
        doctorId: '00000000-0000-0000-0000-000000000002',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        endAt: new Date(Date.now() + 7200000).toISOString(),
        type: 'IN_PERSON',
        reason: 'Consulta general',
      },
    });
    const res = mockRes();
    const next = jest.fn();

    mockPrisma.doctor.findUnique.mockResolvedValue({ id: 'doc-1', isActive: true });
    mockPrisma.appointment.findFirst.mockResolvedValue(null);
    mockPrisma.appointment.create.mockResolvedValue({ id: 'appt-1', status: 'PENDING', patient: {}, doctor: {}, room: null });

    await controller.create(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject when doctor has conflicting appointment', async () => {
    const now = Date.now();
    const req = mockReq({
      body: {
        patientId: '00000000-0000-0000-0000-000000000001',
        doctorId: '00000000-0000-0000-0000-000000000002',
        scheduledAt: new Date(now + 3600000).toISOString(),
        endAt: new Date(now + 7200000).toISOString(),
        type: 'IN_PERSON',
        reason: 'Consulta',
      },
    });
    const res = mockRes();
    const next = jest.fn();

    mockPrisma.doctor.findUnique.mockResolvedValue({ id: 'doc-1', isActive: true });
    mockPrisma.appointment.findFirst.mockResolvedValue({ id: 'conflict-appt' });

    await controller.create(req, res as any, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'CONFLICT' }));
  });

  it('should reject when end time is before start time', async () => {
    const now = Date.now();
    const req = mockReq({
      body: {
        patientId: '00000000-0000-0000-0000-000000000001',
        doctorId: '00000000-0000-0000-0000-000000000002',
        scheduledAt: new Date(now + 7200000).toISOString(),
        endAt: new Date(now + 3600000).toISOString(),
        type: 'IN_PERSON',
        reason: 'Consulta',
      },
    });
    const res = mockRes();
    const next = jest.fn();

    mockPrisma.doctor.findUnique.mockResolvedValue({ id: 'doc-1', isActive: true });

    await controller.create(req, res as any, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 422 }));
  });
});

describe('AppointmentController.changeStatus', () => {
  let controller: AppointmentController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AppointmentController(mockPrisma);
  });

  it('should require cancel reason when cancelling', async () => {
    const req = mockReq({
      params: { id: 'appt-1' },
      body: { status: 'CANCELLED_BY_DOCTOR' },
    });
    const res = mockRes();
    const next = jest.fn();

    mockPrisma.appointment.findUnique.mockResolvedValue({ id: 'appt-1', status: 'PENDING' });

    await controller.changeStatus(req, res as any, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 422 }));
  });

  it('should change status successfully', async () => {
    const req = mockReq({
      params: { id: 'appt-1' },
      body: { status: 'CONFIRMED' },
    });
    const res = mockRes();
    const next = jest.fn();

    mockPrisma.appointment.findUnique.mockResolvedValue({ id: 'appt-1', status: 'PENDING' });
    mockPrisma.appointment.update.mockResolvedValue({ id: 'appt-1', status: 'CONFIRMED' });

    await controller.changeStatus(req, res as any, next);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
