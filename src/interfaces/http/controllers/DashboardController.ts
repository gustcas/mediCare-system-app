import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse } from '../../../shared/types';

export class DashboardController {
  constructor(private readonly prisma: PrismaClient) {}

  getSummary = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const [
        newPatientsMonth,
        appointmentsToday,
        pendingBilling,
        urgentAppointments,
        todayAppointmentsList,
      ] = await Promise.all([
        this.prisma.patient.count({ where: { createdAt: { gte: startOfMonth } } }),
        this.prisma.appointment.count({ where: { scheduledAt: { gte: startOfDay, lt: endOfDay } } }),
        this.prisma.billingRecord.count({ where: { status: 'PENDING' } }),
        this.prisma.appointment.count({
          where: {
            scheduledAt: { gte: startOfDay, lt: endOfDay },
            status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
          },
        }),
        this.prisma.appointment.findMany({
          where: { scheduledAt: { gte: startOfDay, lt: endOfDay } },
          include: {
            patient: true,
            doctor: { include: { specialties: { include: { specialty: true } } } },
          },
          orderBy: { scheduledAt: 'asc' },
          take: 20,
        }),
      ]);

      res.json(successResponse({
        stats: {
          newPatientsMonth,
          appointmentsToday,
          pendingBilling,
          urgentAppointments,
        },
        todayAppointments: todayAppointmentsList,
      }));
    } catch (err) { next(err); }
  };
}
