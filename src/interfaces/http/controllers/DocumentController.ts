import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../../../shared/errors/AppError';
import { successResponse } from '../../../shared/types';

const DocSchema = z.object({
  patientId:      z.string().uuid(),
  appointmentId:  z.string().uuid().optional(),
  clinicalNoteId: z.string().uuid().optional(),
  type:           z.enum(['LAB_REPORT', 'IMAGING', 'PRESCRIPTION_PDF', 'CONSENT_FORM', 'CLINICAL_SUMMARY', 'INSURANCE_DOC', 'OTHER']),
  name:           z.string().min(3),
  fileUrl:        z.string().url(),
  fileSize:       z.number().int().min(1),
  mimeType:       z.string().min(1),
  uploadedBy:     z.string().uuid().optional(),
});

export class DocumentController {
  constructor(private readonly prisma: PrismaClient) {}

  getByPatient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = req.query.type as string | undefined;
      const docs = await this.prisma.document.findMany({
        where:   { patientId: req.params.patientId as string, ...(type && { type: type as any }) },
        orderBy: { createdAt: 'desc' },
      });
      res.json(successResponse(docs));
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = DocSchema.parse(req.body);

      const doc = await this.prisma.document.create({
        data: { ...data, uploadedBy: data.uploadedBy ?? user.id },
      });
      res.status(201).json(successResponse(doc, 'Documento registrado'));
    } catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doc = await this.prisma.document.findUnique({ where: { id: req.params.id as string } });
      if (!doc) throw AppError.notFound('Documento no encontrado');
      await this.prisma.document.delete({ where: { id: req.params.id as string } });
      res.json(successResponse(null, 'Documento eliminado'));
    } catch (err) { next(err); }
  };
}
