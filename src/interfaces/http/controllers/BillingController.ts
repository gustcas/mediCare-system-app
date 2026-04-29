import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../../../shared/errors/AppError';
import { successResponse } from '../../../shared/types';

const CreateBillingSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  insurancePolicyId: z.string().uuid().optional(),
  amount: z.number().positive(),
  patientOwes: z.number().min(0),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  invoiceUrl: z.string().url().optional(),
});

export class BillingController {
  constructor(private readonly prisma: PrismaClient) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page   = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit  = Math.min(100, parseInt(req.query.limit as string) || 20);
      const status = req.query.status as string | undefined;

      const where = status ? { status: status as any } : {};

      const [items, total] = await Promise.all([
        this.prisma.billingRecord.findMany({
          skip:    (page - 1) * limit,
          take:    limit,
          where,
          include: {
            patient: { select: { id: true, firstName: true, lastName: true } },
            appointment: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.billingRecord.count({ where }),
      ]);

      res.json(successResponse({ items, total, page, limit, totalPages: Math.ceil(total / limit) }));
    } catch (err) { next(err); }
  };

  getByPatient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.params.patientId as string;
      const records = await this.prisma.billingRecord.findMany({
        where: { patientId },
        include: { appointment: true, insurancePolicy: true },
        orderBy: { createdAt: 'desc' },
      });
      res.json(successResponse(records));
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = CreateBillingSchema.parse(req.body);
      const record = await this.prisma.billingRecord.create({
        data: { ...data, dueDate: data.dueDate ? new Date(data.dueDate) : undefined },
        include: { appointment: true },
      });
      res.status(201).json(successResponse(record, 'Registro de facturación creado'));
    } catch (err) { next(err); }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = z.object({
        status: z.enum(['PENDING', 'PAID', 'PARTIALLY_PAID', 'INSURANCE_PENDING', 'CANCELLED']),
      }).parse(req.body);

      const id = req.params.id as string;
      const record = await this.prisma.billingRecord.findUnique({ where: { id } });
      if (!record) throw AppError.notFound('Registro no encontrado');

      const updated = await this.prisma.billingRecord.update({
        where: { id },
        data: { status, paidAt: status === 'PAID' ? new Date() : undefined },
      });
      res.json(successResponse(updated, 'Estado actualizado'));
    } catch (err) { next(err); }
  };
}
