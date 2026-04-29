import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../../../shared/errors/AppError';
import { successResponse } from '../../../shared/types';
import { logger } from '../../../shared/utils/logger';

const CreateAdmissionSchema = z.object({
  patientId:     z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  wardId:        z.string().uuid().optional(),
  roomId:        z.string().uuid().optional(),
  admittedAt:    z.string().datetime(),
  reason:        z.string().min(5),
  status:        z.enum(['ADMITTED', 'DISCHARGED', 'TRANSFERRED']).default('ADMITTED'),
});

export class AdmissionController {
  constructor(private readonly prisma: PrismaClient) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page   = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit  = Math.min(100, parseInt(req.query.limit as string) || 20);
      const status = req.query.status as string | undefined;
      const where  = status ? { status: status as any } : {};

      const [items, total] = await Promise.all([
        this.prisma.admission.findMany({
          skip:    (page - 1) * limit,
          take:    limit,
          where,
          include: {
            patient: { select: { id: true, firstName: true, lastName: true, documentNumber: true } },
            ward:    true,
            room:    true,
          },
          orderBy: { admittedAt: 'desc' },
        }),
        this.prisma.admission.count({ where }),
      ]);

      res.json(successResponse({ items, total, page, limit, totalPages: Math.ceil(total / limit) }));
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const admission = await this.prisma.admission.findUnique({
        where:   { id },
        include: { patient: true, ward: true, room: true, appointment: true },
      });
      if (!admission) throw AppError.notFound('Admisión no encontrada');
      res.json(successResponse(admission));
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = CreateAdmissionSchema.parse(req.body);

      const patient = await this.prisma.patient.findUnique({ where: { id: data.patientId } });
      if (!patient) throw AppError.notFound('Paciente no encontrado');

      const admission = await this.prisma.admission.create({
        data: { ...data, admittedAt: new Date(data.admittedAt), admittedBy: user.id },
        include: { patient: true, ward: true, room: true },
      });

      logger.info(`Admisión creada: ${admission.id}`);
      res.status(201).json(successResponse(admission, 'Admisión registrada'));
    } catch (err) { next(err); }
  };

  discharge = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const admission = await this.prisma.admission.findUnique({ where: { id } });
      if (!admission) throw AppError.notFound('Admisión no encontrada');
      if (admission.status === 'DISCHARGED') throw AppError.conflict('El paciente ya fue dado de alta');

      const updated = await this.prisma.admission.update({
        where: { id },
        data:  { status: 'DISCHARGED', dischargedAt: new Date() },
      });

      logger.info(`Alta médica: ${id}`);
      res.json(successResponse(updated, 'Alta registrada'));
    } catch (err) { next(err); }
  };

  getByPatient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.params.patientId as string;
      const admissions = await this.prisma.admission.findMany({
        where:   { patientId },
        include: { ward: true, room: true },
        orderBy: { admittedAt: 'desc' },
      });
      res.json(successResponse(admissions));
    } catch (err) { next(err); }
  };
}
