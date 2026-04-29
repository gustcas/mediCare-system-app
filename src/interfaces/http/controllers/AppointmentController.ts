import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../../../shared/errors/AppError';
import { successResponse } from '../../../shared/types';

const CreateAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  roomId: z.string().uuid().optional(),
  scheduledAt: z.string().datetime(),
  endAt: z.string().datetime(),
  type: z.enum(['VIDEO', 'IN_PERSON']),
  reason: z.string().min(5),
  slEnabled: z.boolean().default(false),
});

const ChangeStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_DOCTOR', 'NO_SHOW']),
  cancelReason: z.string().optional(),
});

export class AppointmentController {
  constructor(private readonly prisma: PrismaClient) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
      const date = req.query.date as string | undefined;
      const doctorId = req.query.doctorId as string | undefined;
      const patientId = req.query.patientId as string | undefined;
      const status = req.query.status as string | undefined;

      const where: Record<string, unknown> = {};
      if (doctorId) where.doctorId = doctorId;
      if (patientId) where.patientId = patientId;
      if (status) where.status = status;
      if (date) {
        // Use explicit UTC boundaries to avoid local-timezone day-shift bugs
        where.scheduledAt = {
          gte: new Date(`${date}T00:00:00.000Z`),
          lte: new Date(`${date}T23:59:59.999Z`),
        };
      }

      const [items, total] = await Promise.all([
        this.prisma.appointment.findMany({
          skip: (page - 1) * limit,
          take: limit,
          where,
          include: {
            patient: true,
            doctor: { include: { specialties: { include: { specialty: true } } } },
            room: true,
          },
          orderBy: { scheduledAt: 'asc' },
        }),
        this.prisma.appointment.count({ where }),
      ]);

      res.json(successResponse({ items, total, page, limit, totalPages: Math.ceil(total / limit) }));
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id   = req.params.id as string;
      const appt = await this.prisma.appointment.findUnique({
        where: { id },
        include: {
          patient: true,
          doctor: { include: { specialties: { include: { specialty: true } } } },
          room: true,
          clinicalNotes: true,
        },
      });
      if (!appt) throw AppError.notFound('Cita no encontrada');
      res.json(successResponse(appt));
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = CreateAppointmentSchema.parse(req.body);
      const scheduledAt = new Date(data.scheduledAt);
      const endAt = new Date(data.endAt);

      if (endAt <= scheduledAt) throw AppError.unprocessable('La hora de fin debe ser posterior a la de inicio');

      // Validate doctor exists
      const doctor = await this.prisma.doctor.findUnique({ where: { id: data.doctorId } });
      if (!doctor || !doctor.isActive) throw AppError.notFound('Doctor no encontrado o inactivo');

      // Check for double booking
      const conflict = await this.prisma.appointment.findFirst({
        where: {
          doctorId: data.doctorId,
          status: { notIn: ['CANCELLED_BY_PATIENT', 'CANCELLED_BY_DOCTOR', 'NO_SHOW'] },
          OR: [
            { scheduledAt: { lt: endAt }, endAt: { gt: scheduledAt } },
          ],
        },
      });
      if (conflict) throw AppError.conflict('El doctor ya tiene una cita en ese horario');

      const appointment = await this.prisma.appointment.create({
        data: {
          ...data,
          scheduledAt,
          endAt,
          createdBy: req.user!.id,
        },
        include: { patient: true, doctor: true, room: true },
      });

      res.status(201).json(successResponse(appointment, 'Cita creada'));
    } catch (err) { next(err); }
  };

  changeStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const { status, cancelReason } = ChangeStatusSchema.parse(req.body);
      const appt = await this.prisma.appointment.findUnique({ where: { id } });
      if (!appt) throw AppError.notFound('Cita no encontrada');

      const isCancellation = status === 'CANCELLED_BY_PATIENT' || status === 'CANCELLED_BY_DOCTOR';
      if (isCancellation && !cancelReason) {
        throw AppError.unprocessable('Se requiere motivo de cancelación');
      }

      const updated = await this.prisma.appointment.update({
        where: { id },
        data: {
          status,
          cancelReason: isCancellation ? cancelReason : undefined,
          canceledAt: isCancellation ? new Date() : undefined,
        },
      });
      res.json(successResponse(updated, 'Estado actualizado'));
    } catch (err) { next(err); }
  };

  checkAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { doctorId, scheduledAt, endAt } = z.object({
        doctorId: z.string().uuid(),
        scheduledAt: z.string().datetime(),
        endAt: z.string().datetime(),
      }).parse(req.query);

      const conflict = await this.prisma.appointment.findFirst({
        where: {
          doctorId,
          status: { notIn: ['CANCELLED_BY_PATIENT', 'CANCELLED_BY_DOCTOR', 'NO_SHOW'] },
          OR: [{ scheduledAt: { lt: new Date(endAt) }, endAt: { gt: new Date(scheduledAt) } }],
        },
      });

      res.json(successResponse({ available: !conflict, conflict }));
    } catch (err) { next(err); }
  };
}
