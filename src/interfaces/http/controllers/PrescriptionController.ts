import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../../../shared/errors/AppError';
import { successResponse } from '../../../shared/types';

const PrescriptionItemSchema = z.object({
  medicationVariantId: z.string().uuid(),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.string().min(1),
  instructions: z.string().optional(),
  refillsLeft: z.number().int().min(0).default(0),
});

const CreatePrescriptionSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  clinicalNoteId: z.string().uuid().optional(),
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  notes: z.string().optional(),
  items: z.array(PrescriptionItemSchema).min(1),
});

export class PrescriptionController {
  constructor(private readonly prisma: PrismaClient) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
      const status = req.query.status as string | undefined;

      const where = status ? { status: status as any } : {};

      const [items, total] = await Promise.all([
        this.prisma.prescription.findMany({
          skip:    (page - 1) * limit,
          take:    limit,
          where,
          include: {
            patient: { select: { id: true, firstName: true, lastName: true } },
            doctor:  { select: { id: true, licenseNumber: true } },
            items:   { include: { medicationVariant: { include: { medication: true } } } },
          },
          orderBy: { issuedAt: 'desc' },
        }),
        this.prisma.prescription.count({ where }),
      ]);

      res.json(successResponse({ items, total, page, limit, totalPages: Math.ceil(total / limit) }));
    } catch (err) { next(err); }
  };

  getByPatient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prescriptions = await this.prisma.prescription.findMany({
        where: { patientId: req.params.patientId as string },
        include: { items: { include: { medicationVariant: { include: { medication: true } } } } },
        orderBy: { issuedAt: 'desc' },
      });
      res.json(successResponse(prescriptions));
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { items, ...data } = CreatePrescriptionSchema.parse(req.body);

      const prescription = await this.prisma.prescription.create({
        data: {
          ...data,
          issuedAt: new Date(data.issuedAt),
          expiresAt: new Date(data.expiresAt),
          items: { create: items },
        },
        include: { items: { include: { medicationVariant: { include: { medication: true } } } } },
      });
      res.status(201).json(successResponse(prescription, 'Receta creada'));
    } catch (err) { next(err); }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = z.object({ status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED']) }).parse(req.body);
      const id = req.params.id as string;
      const pres = await this.prisma.prescription.findUnique({ where: { id } });
      if (!pres) throw AppError.notFound('Receta no encontrada');
      const updated = await this.prisma.prescription.update({ where: { id }, data: { status } });
      res.json(successResponse(updated, 'Estado actualizado'));
    } catch (err) { next(err); }
  };
}
