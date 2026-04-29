import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../../../shared/errors/AppError';
import { successResponse } from '../../../shared/types';

const PolicySchema = z.object({
  patientId:    z.string().uuid(),
  provider:     z.string().min(2),
  policyNumber: z.string().min(3),
  groupNumber:  z.string().optional(),
  holderName:   z.string().min(2),
  coverageType: z.string().min(2),
  validFrom:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  validTo:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  copayAmount:  z.number().min(0).optional(),
  deductible:   z.number().min(0).optional(),
});

export class InsurancePolicyController {
  constructor(private readonly prisma: PrismaClient) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit = Math.min(100, parseInt(req.query.limit as string) || 50);

      const [items, total] = await Promise.all([
        this.prisma.insurancePolicy.findMany({
          skip:    (page - 1) * limit,
          take:    limit,
          include: { patient: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { validFrom: 'desc' },
        }),
        this.prisma.insurancePolicy.count(),
      ]);

      res.json(successResponse({ items, total, page, limit, totalPages: Math.ceil(total / limit) }));
    } catch (err) { next(err); }
  };

  getByPatient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.params.patientId as string;
      const policies  = await this.prisma.insurancePolicy.findMany({
        where:   { patientId },
        orderBy: { validFrom: 'desc' },
      });
      res.json(successResponse(policies));
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = PolicySchema.parse(req.body);
      const policy = await this.prisma.insurancePolicy.create({
        data: {
          ...data,
          validFrom: new Date(data.validFrom),
          validTo:   new Date(data.validTo),
        },
      });
      res.status(201).json(successResponse(policy, 'Póliza registrada'));
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id     = req.params.id as string;
      const policy = await this.prisma.insurancePolicy.findUnique({ where: { id } });
      if (!policy) throw AppError.notFound('Póliza no encontrada');

      const data = PolicySchema.partial().omit({ patientId: true }).parse(req.body);
      const updated = await this.prisma.insurancePolicy.update({
        where: { id },
        data:  {
          ...data,
          validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
          validTo:   data.validTo   ? new Date(data.validTo)   : undefined,
        },
      });
      res.json(successResponse(updated, 'Póliza actualizada'));
    } catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id     = req.params.id as string;
      const policy = await this.prisma.insurancePolicy.findUnique({ where: { id } });
      if (!policy) throw AppError.notFound('Póliza no encontrada');
      await this.prisma.insurancePolicy.delete({ where: { id } });
      res.json(successResponse(null, 'Póliza eliminada'));
    } catch (err) { next(err); }
  };
}
