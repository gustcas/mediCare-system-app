import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../../../shared/errors/AppError';
import { successResponse } from '../../../shared/types';

const CreateTestResultSchema = z.object({
  patientId: z.string().uuid(),
  labTestId: z.string().uuid(),
  orderedBy: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  values: z.record(z.unknown()).optional(),
  notes: z.string().optional(),
});

export class LabController {
  constructor(private readonly prisma: PrismaClient) {}

  listTests = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const tests = await this.prisma.labTest.findMany({ orderBy: { name: 'asc' } });
      res.json(successResponse(tests));
    } catch (err) { next(err); }
  };

  listResults = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page   = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit  = Math.min(100, parseInt(req.query.limit as string) || 20);
      const status = req.query.status as string | undefined;
      const where  = status ? { status: status as any } : {};

      const [items, total] = await Promise.all([
        this.prisma.testResult.findMany({
          skip:    (page - 1) * limit,
          take:    limit,
          where,
          include: { labTest: true },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.testResult.count({ where }),
      ]);

      res.json(successResponse({ items, total, page, limit, totalPages: Math.ceil(total / limit) }));
    } catch (err) { next(err); }
  };

  getResultsByPatient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const results = await this.prisma.testResult.findMany({
        where: { patientId: req.params.patientId as string },
        include: { labTest: true },
        orderBy: { createdAt: 'desc' },
      });
      res.json(successResponse(results));
    } catch (err) { next(err); }
  };

  createResult = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = CreateTestResultSchema.parse(req.body);
      const result = await this.prisma.testResult.create({
        data: { ...data, values: data.values as any },
        include: { labTest: true },
      });
      res.status(201).json(successResponse(result, 'Resultado registrado'));
    } catch (err) { next(err); }
  };

  updateResultStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, values, notes } = z.object({
        status: z.enum(['PENDING', 'AVAILABLE', 'REVIEWED', 'CANCELLED']),
        values: z.record(z.unknown()).optional(),
        notes: z.string().optional(),
      }).parse(req.body);

      const id = req.params.id as string;
      const result = await this.prisma.testResult.findUnique({ where: { id } });
      if (!result) throw AppError.notFound('Resultado no encontrado');

      const updated = await this.prisma.testResult.update({
        where: { id },
        data: { status, values: values as any, notes, resultDate: status === 'AVAILABLE' ? new Date() : undefined },
      });
      res.json(successResponse(updated, 'Estado actualizado'));
    } catch (err) { next(err); }
  };
}
