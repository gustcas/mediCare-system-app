import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../../../shared/errors/AppError';
import { successResponse } from '../../../shared/types';

export class DiagnosisController {
  constructor(private readonly prisma: PrismaClient) {}

  searchCodes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q     = (req.query.q as string | undefined)?.trim();
      const limit = Math.min(50, parseInt(req.query.limit as string) || 20);

      const codes = await this.prisma.diagnosisCode.findMany({
        where: q ? {
          OR: [
            { code:        { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        } : {},
        take:    limit,
        orderBy: { code: 'asc' },
      });
      res.json(successResponse(codes));
    } catch (err) { next(err); }
  };

  getByPatient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.params.patientId as string;
      const diagnoses = await this.prisma.patientDiagnosis.findMany({
        where:   { patientId },
        include: { diagnosisCode: true, doctor: true },
        orderBy: { diagnosedAt: 'desc' },
      });
      res.json(successResponse(diagnoses));
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = z.object({
        patientId:       z.string().uuid(),
        diagnosisCodeId: z.string().uuid(),
        diagnosedBy:     z.string().uuid(),
        diagnosedAt:     z.string().datetime(),
        notes:           z.string().optional(),
      }).parse(req.body);

      const diagnosis = await this.prisma.patientDiagnosis.create({
        data:    { ...data, diagnosedAt: new Date(data.diagnosedAt) },
        include: { diagnosisCode: true },
      });
      res.status(201).json(successResponse(diagnosis, 'Diagnóstico registrado'));
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const dx = await this.prisma.patientDiagnosis.findUnique({ where: { id } });
      if (!dx) throw AppError.notFound('Diagnóstico no encontrado');

      const data = z.object({
        resolvedAt: z.string().datetime().optional(),
        notes:      z.string().optional(),
      }).parse(req.body);

      const updated = await this.prisma.patientDiagnosis.update({
        where:   { id },
        data:    { ...data, resolvedAt: data.resolvedAt ? new Date(data.resolvedAt) : undefined },
        include: { diagnosisCode: true },
      });
      res.json(successResponse(updated, 'Diagnóstico actualizado'));
    } catch (err) { next(err); }
  };
}
