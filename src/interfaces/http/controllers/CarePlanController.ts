import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../../../shared/errors/AppError';
import { successResponse } from '../../../shared/types';
import { logger } from '../../../shared/utils/logger';

const CreatePlanSchema = z.object({
  patientId:   z.string().uuid(),
  doctorId:    z.string().uuid(),
  title:       z.string().min(3),
  description: z.string().optional(),
  startDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  goals: z.array(z.object({
    description: z.string().min(3),
    targetDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    notes:       z.string().optional(),
  })).optional(),
  items: z.array(z.object({
    type:        z.enum(['MEDICATION', 'PROCEDURE', 'FOLLOW_UP_APPOINTMENT', 'LAB_TEST', 'MONITORING', 'EDUCATION', 'OTHER']),
    description: z.string().min(3),
    frequency:   z.string().optional(),
  })).optional(),
});

export class CarePlanController {
  constructor(private readonly prisma: PrismaClient) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page   = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit  = Math.min(100, parseInt(req.query.limit as string) || 20);
      const status = req.query.status as string | undefined;
      const where  = status ? { status: status as any } : {};

      const [items, total] = await Promise.all([
        this.prisma.carePlan.findMany({
          skip:    (page - 1) * limit,
          take:    limit,
          where,
          include: {
            goals:   true,
            items:   true,
            patient: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.carePlan.count({ where }),
      ]);

      res.json(successResponse({ items, total, page, limit, totalPages: Math.ceil(total / limit) }));
    } catch (err) { next(err); }
  };

  getByPatient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.params.patientId as string;
      const plans = await this.prisma.carePlan.findMany({
        where:   { patientId },
        include: { goals: true, items: true },
        orderBy: { createdAt: 'desc' },
      });
      res.json(successResponse(plans));
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const plan = await this.prisma.carePlan.findUnique({
        where:   { id },
        include: { goals: true, items: true, patient: true, doctor: true },
      });
      if (!plan) throw AppError.notFound('Plan de cuidado no encontrado');
      res.json(successResponse(plan));
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { goals, items, ...data } = CreatePlanSchema.parse(req.body);

      const plan = await this.prisma.carePlan.create({
        data: {
          ...data,
          startDate: new Date(data.startDate),
          endDate:   data.endDate ? new Date(data.endDate) : undefined,
          status:    'ACTIVE',
          ...(goals?.length && {
            goals: {
              create: goals.map(g => ({
                description: g.description,
                targetDate:  g.targetDate ? new Date(g.targetDate) : undefined,
                notes:       g.notes,
              })),
            },
          }),
          ...(items?.length && {
            items: {
              create: items.map(i => ({
                type:        i.type,
                description: i.description,
                frequency:   i.frequency,
              })),
            },
          }),
        },
        include: { goals: true, items: true },
      });

      logger.info(`Plan de cuidado creado: ${plan.id}`);
      res.status(201).json(successResponse(plan, 'Plan de cuidado creado'));
    } catch (err) { next(err); }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const { status } = z.object({ status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']) }).parse(req.body);
      const plan = await this.prisma.carePlan.findUnique({ where: { id } });
      if (!plan) throw AppError.notFound('Plan de cuidado no encontrado');
      const updated = await this.prisma.carePlan.update({ where: { id }, data: { status } });
      res.json(successResponse(updated, 'Estado actualizado'));
    } catch (err) { next(err); }
  };

  updateGoalProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const goalId = req.params.goalId as string;
      const { status } = z.object({
        status: z.enum(['PENDING', 'IN_PROGRESS', 'ACHIEVED', 'ABANDONED']),
      }).parse(req.body);

      const goal = await this.prisma.carePlanGoal.findUnique({ where: { id: goalId } });
      if (!goal) throw AppError.notFound('Objetivo no encontrado');

      const updated = await this.prisma.carePlanGoal.update({
        where: { id: goalId },
        data:  { status, achievedAt: status === 'ACHIEVED' ? new Date() : null },
      });
      res.json(successResponse(updated, 'Progreso actualizado'));
    } catch (err) { next(err); }
  };
}
