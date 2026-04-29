import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../../../shared/errors/AppError';
import { successResponse } from '../../../shared/types';
import { logger } from '../../../shared/utils/logger';

const CreatePatientSchema = z.object({
  firstName:      z.string().min(2, 'Nombre requerido'),
  lastName:       z.string().min(2, 'Apellido requerido'),
  documentType:   z.enum(['DNI', 'PASSPORT', 'CE', 'RUC', 'OTHER']).optional(),
  documentNumber: z.string().min(5).optional(),
  phone:          z.string().optional(),
  address:        z.string().optional(),
  dateOfBirth:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  gender:         z.enum(['MALE', 'FEMALE', 'OTHERS']),
  bloodType:      z.enum(['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG']).optional(),
});

const UpdatePatientSchema = CreatePatientSchema.partial();

export class PatientController {
  constructor(private readonly prisma: PrismaClient) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page   = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit  = Math.min(100, parseInt(req.query.limit as string) || 20);
      const search = (req.query.search as string | undefined)?.trim();

      const where = search
        ? {
            OR: [
              { firstName:      { contains: search, mode: 'insensitive' as const } },
              { lastName:       { contains: search, mode: 'insensitive' as const } },
              { documentNumber: { contains: search, mode: 'insensitive' as const } },
              { phone:          { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {};

      const [items, total] = await Promise.all([
        this.prisma.patient.findMany({
          skip:    (page - 1) * limit,
          take:    limit,
          where,
          include: {
            allergies:         true,
            emergencyContacts: { where: { isPrimary: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.patient.count({ where }),
      ]);

      res.json(successResponse({ items, total, page, limit, totalPages: Math.ceil(total / limit) }));
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const patient = await this.prisma.patient.findUnique({
        where:   { id },
        include: {
          allergies:         true,
          emergencyContacts: true,
          appointments: {
            orderBy: { scheduledAt: 'desc' },
            take:    10,
            include: { doctor: true },
          },
          patientDiagnoses: { include: { diagnosisCode: true } },
        },
      });
      if (!patient) throw AppError.notFound('Paciente no encontrado');
      res.json(successResponse(patient));
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = CreatePatientSchema.parse(req.body);

      if (data.documentNumber) {
        const existing = await this.prisma.patient.findUnique({ where: { documentNumber: data.documentNumber } });
        if (existing) throw AppError.conflict('Ya existe un paciente con ese número de documento');
      }

      const patient = await this.prisma.patient.create({
        data: { ...data, dateOfBirth: new Date(data.dateOfBirth) },
      });

      logger.info(`Paciente creado: ${patient.id}`, { patientId: patient.id });
      res.status(201).json(successResponse(patient, 'Paciente creado correctamente'));
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id      = req.params.id as string;
      const patient = await this.prisma.patient.findUnique({ where: { id } });
      if (!patient) throw AppError.notFound('Paciente no encontrado');

      const data = UpdatePatientSchema.parse(req.body);

      if (data.documentNumber && data.documentNumber !== patient.documentNumber) {
        const dup = await this.prisma.patient.findUnique({ where: { documentNumber: data.documentNumber } });
        if (dup) throw AppError.conflict('Número de documento ya registrado en otro paciente');
      }

      const updated = await this.prisma.patient.update({
        where: { id },
        data:  { ...data, dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined },
      });

      logger.info(`Paciente actualizado: ${updated.id}`);
      res.json(successResponse(updated, 'Paciente actualizado'));
    } catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id      = req.params.id as string;
      const patient = await this.prisma.patient.findUnique({ where: { id } });
      if (!patient) throw AppError.notFound('Paciente no encontrado');
      await this.prisma.patient.delete({ where: { id } });
      logger.info(`Paciente eliminado: ${id}`);
      res.json(successResponse(null, 'Paciente eliminado'));
    } catch (err) { next(err); }
  };

  getAllergies = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.params.id as string;
      const allergies = await this.prisma.patientAllergy.findMany({ where: { patientId } });
      res.json(successResponse(allergies));
    } catch (err) { next(err); }
  };

  createAllergy = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.params.id as string;
      const data = z.object({
        substance: z.string().min(1),
        severity:  z.enum(['MILD', 'MODERATE', 'SEVERE', 'ANAPHYLACTIC']),
        reaction:  z.string().optional(),
        notes:     z.string().optional(),
      }).parse(req.body);

      const allergy = await this.prisma.patientAllergy.create({
        data: { ...data, patientId },
      });
      res.status(201).json(successResponse(allergy, 'Alergia registrada'));
    } catch (err) { next(err); }
  };

  getEmergencyContacts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.params.id as string;
      const contacts  = await this.prisma.emergencyContact.findMany({ where: { patientId } });
      res.json(successResponse(contacts));
    } catch (err) { next(err); }
  };

  createEmergencyContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.params.id as string;
      const data = z.object({
        fullName:     z.string().min(2),
        relationship: z.enum(['SPOUSE', 'PARENT', 'SIBLING', 'CHILD', 'FRIEND', 'GUARDIAN', 'OTHER']),
        phone:        z.string().min(6),
        phoneAlt:     z.string().optional(),
        isPrimary:    z.boolean().optional(),
      }).parse(req.body);

      const contact = await this.prisma.emergencyContact.create({
        data: { ...data, patientId },
      });
      res.status(201).json(successResponse(contact, 'Contacto de emergencia registrado'));
    } catch (err) { next(err); }
  };
}
