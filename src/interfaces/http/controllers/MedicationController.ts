import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../../../shared/errors/AppError';
import { successResponse } from '../../../shared/types';

const MED_FORMS = ['TABLET', 'CAPSULE', 'SYRUP', 'INJECTABLE', 'PATCH', 'DROPS', 'CREAM', 'POWDER', 'OTHER'] as const;
const MED_CATS  = ['ANALGESIC', 'ANTIBIOTIC', 'ANTIHYPERTENSIVE', 'ANTIDIABETIC', 'ANTIHISTAMINE', 'ANTIDEPRESSANT', 'ANXIOLYTIC', 'ANTICOAGULANT', 'OTHER'] as const;

export class MedicationController {
  constructor(private readonly prisma: PrismaClient) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q     = (req.query.q as string | undefined)?.trim();
      const limit = Math.min(100, parseInt(req.query.limit as string) || 50);

      const meds = await this.prisma.medication.findMany({
        where: q
          ? { OR: [
              { name:        { contains: q, mode: 'insensitive' } },
              { genericName: { contains: q, mode: 'insensitive' } },
            ]}
          : {},
        take:    limit,
        include: { variants: true },
        orderBy: { name: 'asc' },
      });
      res.json(successResponse(meds));
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id  = req.params.id as string;
      const med = await this.prisma.medication.findUnique({ where: { id }, include: { variants: true } });
      if (!med) throw AppError.notFound('Medicamento no encontrado');
      res.json(successResponse(med));
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = z.object({
        name:        z.string().min(2),
        genericName: z.string().min(2),
        description: z.string().optional(),
        variants: z.array(z.object({
          form:     z.enum(MED_FORMS),
          strength: z.string().min(1),
          category: z.enum(MED_CATS),
        })).optional(),
      }).parse(req.body);

      const { variants, ...medData } = data;
      const med = await this.prisma.medication.create({
        data: {
          ...medData,
          ...(variants?.length && { variants: { create: variants } }),
        },
        include: { variants: true },
      });
      res.status(201).json(successResponse(med, 'Medicamento registrado'));
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id  = req.params.id as string;
      const med = await this.prisma.medication.findUnique({ where: { id } });
      if (!med) throw AppError.notFound('Medicamento no encontrado');

      const data = z.object({
        name:        z.string().min(2).optional(),
        genericName: z.string().min(2).optional(),
        description: z.string().optional(),
      }).parse(req.body);

      const updated = await this.prisma.medication.update({
        where:   { id },
        data,
        include: { variants: true },
      });
      res.json(successResponse(updated));
    } catch (err) { next(err); }
  };

  deactivateVariant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const variantId = req.params.variantId as string;
      const variant   = await this.prisma.medicationVariant.findUnique({ where: { id: variantId } });
      if (!variant) throw AppError.notFound('Variante no encontrada');
      const updated = await this.prisma.medicationVariant.update({
        where: { id: variantId },
        data:  { isActive: false },
      });
      res.json(successResponse(updated, 'Variante desactivada'));
    } catch (err) { next(err); }
  };
}
