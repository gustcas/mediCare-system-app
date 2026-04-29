import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../../../shared/errors/AppError';
import { successResponse } from '../../../shared/types';

const CreateDoctorSchema = z.object({
  userId:        z.string().uuid(),
  firstName:     z.string().min(2).optional(),
  lastName:      z.string().min(2).optional(),
  licenseNumber: z.string().min(3),
  bio:           z.string().optional(),
  specialtyIds:  z.array(z.string().uuid()).optional(),
});

const AvailabilitySchema = z.object({
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  buildingId: z.string().uuid().optional(),
});

export class DoctorController {
  constructor(private readonly prisma: PrismaClient) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, parseInt(req.query.limit as string) || 20);

      const [items, total] = await Promise.all([
        this.prisma.doctor.findMany({
          skip: (page - 1) * limit,
          take: limit,
          where: { isActive: true },
          include: { specialties: { include: { specialty: true } }, availability: true },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.doctor.count({ where: { isActive: true } }),
      ]);

      res.json(successResponse({ items, total, page, limit, totalPages: Math.ceil(total / limit) }));
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doctor = await this.prisma.doctor.findUnique({
        where: { id: req.params.id as string as string },
        include: { specialties: { include: { specialty: true } }, availability: true },
      });
      if (!doctor) throw AppError.notFound('Doctor no encontrado');
      res.json(successResponse(doctor));
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { specialtyIds, ...data } = CreateDoctorSchema.parse(req.body);
      const existing = await this.prisma.doctor.findUnique({ where: { licenseNumber: data.licenseNumber } });
      if (existing) throw AppError.conflict('Ya existe un doctor con ese número de licencia');

      const doctor = await this.prisma.doctor.create({
        data: {
          ...data,
          ...(specialtyIds?.length && {
            specialties: {
              create: specialtyIds.map(sid => ({ specialtyId: sid, type: 'PRIMARY' })),
            },
          }),
        },
        include: { specialties: { include: { specialty: true } } },
      });
      res.status(201).json(successResponse(doctor, 'Doctor creado'));
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doctor = await this.prisma.doctor.findUnique({ where: { id: req.params.id as string as string } });
      if (!doctor) throw AppError.notFound('Doctor no encontrado');
      const updated = await this.prisma.doctor.update({
        where: { id: req.params.id as string },
        data: { bio: req.body.bio, isActive: req.body.isActive, firstName: req.body.firstName, lastName: req.body.lastName },
      });
      res.json(successResponse(updated, 'Doctor actualizado'));
    } catch (err) { next(err); }
  };

  setAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slots = z.array(AvailabilitySchema).parse(req.body);
      const doctor = await this.prisma.doctor.findUnique({ where: { id: req.params.id as string as string } });
      if (!doctor) throw AppError.notFound('Doctor no encontrado');

      await this.prisma.doctorAvailability.deleteMany({ where: { doctorId: req.params.id as string } });
      await this.prisma.doctorAvailability.createMany({
        data: slots.map(s => ({ ...s, doctorId: req.params.id as string })),
      });

      const availability = await this.prisma.doctorAvailability.findMany({ where: { doctorId: req.params.id as string } });
      res.json(successResponse(availability, 'Disponibilidad actualizada'));
    } catch (err) { next(err); }
  };
}
