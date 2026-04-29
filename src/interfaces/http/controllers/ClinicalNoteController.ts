import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../../../shared/errors/AppError';
import { successResponse } from '../../../shared/types';

const CreateNoteSchema = z.object({
  appointmentId: z.string().uuid(),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  diagnosisCodes: z.array(z.string().uuid()).optional(),
});

const UpdateNoteSchema = CreateNoteSchema.omit({ appointmentId: true }).partial();

export class ClinicalNoteController {
  constructor(private readonly prisma: PrismaClient) {}

  getByAppointment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notes = await this.prisma.clinicalNote.findMany({
        where: { appointmentId: req.params.appointmentId as string },
        include: { diagnoses: { include: { diagnosisCode: true } } },
      });
      res.json(successResponse(notes));
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { diagnosisCodes, ...data } = CreateNoteSchema.parse(req.body);

      const appt = await this.prisma.appointment.findUnique({ where: { id: data.appointmentId } });
      if (!appt) throw AppError.notFound('Cita no encontrada');

      const note = await this.prisma.clinicalNote.create({
        data: {
          ...data,
          ...(diagnosisCodes?.length && {
            diagnoses: {
              create: diagnosisCodes.map(id => ({ diagnosisCodeId: id })),
            },
          }),
        },
        include: { diagnoses: { include: { diagnosisCode: true } } },
      });
      res.status(201).json(successResponse(note, 'Nota clínica creada'));
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const note = await this.prisma.clinicalNote.findUnique({ where: { id: req.params.id as string } });
      if (!note) throw AppError.notFound('Nota no encontrada');
      if (note.isLocked) throw AppError.forbidden('Esta nota ya está bloqueada y no puede editarse');

      const { diagnosisCodes, ...data } = UpdateNoteSchema.parse(req.body);
      const updated = await this.prisma.clinicalNote.update({
        where: { id: req.params.id as string },
        data,
        include: { diagnoses: { include: { diagnosisCode: true } } },
      });
      res.json(successResponse(updated, 'Nota actualizada'));
    } catch (err) { next(err); }
  };

  lock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const note = await this.prisma.clinicalNote.findUnique({ where: { id: req.params.id as string } });
      if (!note) throw AppError.notFound('Nota no encontrada');
      if (note.isLocked) throw AppError.conflict('La nota ya está bloqueada');

      const updated = await this.prisma.clinicalNote.update({
        where: { id: req.params.id as string },
        data: { isLocked: true, lockedBy: req.user!.id, lockedAt: new Date() },
      });
      res.json(successResponse(updated, 'Nota bloqueada'));
    } catch (err) { next(err); }
  };
}
