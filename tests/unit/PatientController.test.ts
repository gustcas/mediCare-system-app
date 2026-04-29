import { PatientController } from '../../src/interfaces/http/controllers/PatientController';
import { AppError } from '../../src/shared/errors/AppError';

const mockPrisma = {
  patient: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  patientAllergy: { findMany: jest.fn() },
  emergencyContact: { findMany: jest.fn() },
} as any;

const mockRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
const mockReq = (overrides = {}) => ({ query: {}, params: {}, body: {}, user: { id: 'user-1', roles: ['ADMIN'], permissions: [] }, ...overrides } as any);

const VALID_PATIENT = {
  firstName:  'Ana',
  lastName:   'García',
  dateOfBirth: '1990-01-15',
  gender:     'FEMALE',
};

describe('PatientController', () => {
  let controller: PatientController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new PatientController(mockPrisma);
  });

  describe('list', () => {
    it('returns paginated patients', async () => {
      mockPrisma.patient.findMany.mockResolvedValue([{ id: 'p1', firstName: 'Ana', lastName: 'García', gender: 'FEMALE' }]);
      mockPrisma.patient.count.mockResolvedValue(1);

      const req = mockReq({ query: { page: '1', limit: '10' } });
      const res = mockRes();
      await controller.list(req, res as any, jest.fn());

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      expect(res.json.mock.calls[0][0].data.items).toHaveLength(1);
    });

    it('filters by search term', async () => {
      mockPrisma.patient.findMany.mockResolvedValue([]);
      mockPrisma.patient.count.mockResolvedValue(0);

      await controller.list(mockReq({ query: { search: 'Ana' } }), mockRes() as any, jest.fn());

      expect(mockPrisma.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) }),
      );
    });
  });

  describe('getById', () => {
    it('returns 404 when patient not found', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(null);
      const next = jest.fn();
      await controller.getById(mockReq({ params: { id: 'p1' } }), mockRes() as any, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it('returns patient when found', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue({
        id: 'p1', firstName: 'Ana', lastName: 'García', gender: 'FEMALE',
        allergies: [], emergencyContacts: [], appointments: [], patientDiagnoses: [],
      });
      const res = mockRes();
      await controller.getById(mockReq({ params: { id: 'p1' } }), res as any, jest.fn());
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('create', () => {
    it('creates patient successfully', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(null);
      mockPrisma.patient.create.mockResolvedValue({ id: 'p-new', ...VALID_PATIENT });

      const res = mockRes();
      await controller.create(mockReq({ body: VALID_PATIENT }), res as any, jest.fn());

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockPrisma.patient.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ firstName: 'Ana', lastName: 'García', gender: 'FEMALE' }),
        }),
      );
    });

    it('rejects duplicate documentNumber', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue({ id: 'existing' });
      const next = jest.fn();
      await controller.create(
        mockReq({ body: { ...VALID_PATIENT, documentNumber: '12345678' } }),
        mockRes() as any,
        next,
      );
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409 }));
    });

    it('rejects invalid gender value', async () => {
      const next = jest.fn();
      await controller.create(
        mockReq({ body: { ...VALID_PATIENT, gender: 'INVALID' } }),
        mockRes() as any,
        next,
      );
      expect(next).toHaveBeenCalled();
    });

    it('rejects missing required fields', async () => {
      const next = jest.fn();
      await controller.create(mockReq({ body: { dateOfBirth: '1990-01-15', gender: 'MALE' } }), mockRes() as any, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('returns 404 when patient not found', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(null);
      const next = jest.fn();
      await controller.update(mockReq({ params: { id: 'p1' }, body: { firstName: 'Juan' } }), mockRes() as any, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it('updates patient fields', async () => {
      const existing = { id: 'p1', ...VALID_PATIENT, documentNumber: null };
      mockPrisma.patient.findUnique.mockResolvedValue(existing);
      mockPrisma.patient.update.mockResolvedValue({ ...existing, firstName: 'Ana María' });

      const res = mockRes();
      await controller.update(mockReq({ params: { id: 'p1' }, body: { firstName: 'Ana María' } }), res as any, jest.fn());

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('delete', () => {
    it('returns 404 when patient not found', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(null);
      const next = jest.fn();
      await controller.delete(mockReq({ params: { id: 'p1' } }), mockRes() as any, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it('deletes patient successfully', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.patient.delete.mockResolvedValue({ id: 'p1' });

      const res = mockRes();
      await controller.delete(mockReq({ params: { id: 'p1' } }), res as any, jest.fn());

      expect(mockPrisma.patient.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
