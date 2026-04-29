import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../../../shared/errors/AppError';
import { successResponse } from '../../../shared/types';

export class FacilityController {
  constructor(private readonly prisma: PrismaClient) {}

  // ── Specialties ──────────────────────────────────────────────────────────────
  listSpecialties = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const specialties = await this.prisma.specialty.findMany({ orderBy: { name: 'asc' } });
      res.json(successResponse(specialties));
    } catch (err) { next(err); }
  };

  createSpecialty = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = z.object({ name: z.string().min(2), description: z.string().optional() }).parse(req.body);
      const existing = await this.prisma.specialty.findUnique({ where: { name: data.name } });
      if (existing) throw AppError.conflict('Especialidad ya existe');
      const sp = await this.prisma.specialty.create({ data });
      res.status(201).json(successResponse(sp, 'Especialidad creada'));
    } catch (err) { next(err); }
  };

  updateSpecialty = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sp = await this.prisma.specialty.findUnique({ where: { id: req.params.id as string } });
      if (!sp) throw AppError.notFound('Especialidad no encontrada');
      const data = z.object({
        name: z.string().min(2).optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      }).parse(req.body);
      const updated = await this.prisma.specialty.update({ where: { id: req.params.id as string }, data });
      res.json(successResponse(updated));
    } catch (err) { next(err); }
  };

  // ── Buildings ─────────────────────────────────────────────────────────────────
  listBuildings = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const buildings = await this.prisma.building.findMany({
        include: { wards: true, rooms: true },
        orderBy: { name: 'asc' },
      });
      res.json(successResponse(buildings));
    } catch (err) { next(err); }
  };

  createBuilding = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = z.object({
        name:     z.string().min(2),
        address:  z.string().min(3),
        district: z.string().optional(),
        city:     z.string().min(2),
        country:  z.string().default('PE'),
        phone:    z.string().optional(),
      }).parse(req.body);
      const b = await this.prisma.building.create({ data });
      res.status(201).json(successResponse(b, 'Edificio creado'));
    } catch (err) { next(err); }
  };

  // ── Wards ─────────────────────────────────────────────────────────────────────
  listWards = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const where = req.query.buildingId ? { buildingId: req.query.buildingId as string } : {};
      const wards = await this.prisma.ward.findMany({
        where,
        include: { building: true },
        orderBy: { name: 'asc' },
      });
      res.json(successResponse(wards));
    } catch (err) { next(err); }
  };

  createWard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = z.object({
        name:       z.string().min(2),
        buildingId: z.string().uuid(),
        type:       z.enum(['GENERAL', 'ICU', 'PEDIATRICS', 'MATERNITY', 'ONCOLOGY', 'CARDIOLOGY', 'SURGICAL', 'PSYCHIATRY', 'OTHER']),
        floor:      z.string().optional(),
        capacity:   z.number().int().min(1).optional(),
      }).parse(req.body);
      const ward = await this.prisma.ward.create({ data, include: { building: true } });
      res.status(201).json(successResponse(ward, 'Sala creada'));
    } catch (err) { next(err); }
  };

  // ── Rooms ─────────────────────────────────────────────────────────────────────
  listRooms = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const where = req.query.buildingId ? { buildingId: req.query.buildingId as string } : {};
      const rooms = await this.prisma.room.findMany({
        where,
        include: { building: true },
        orderBy: { name: 'asc' },
      });
      res.json(successResponse(rooms));
    } catch (err) { next(err); }
  };

  createRoom = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = z.object({
        name:       z.string().min(1),
        buildingId: z.string().uuid(),
        type:       z.enum(['CONSULTATION', 'EMERGENCY', 'LAB', 'OPERATING', 'WARD', 'IMAGING']),
        floor:      z.string().optional(),
      }).parse(req.body);
      const room = await this.prisma.room.create({ data, include: { building: true } });
      res.status(201).json(successResponse(room, 'Consultorio creado'));
    } catch (err) { next(err); }
  };

  updateRoom = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const room = await this.prisma.room.findUnique({ where: { id: req.params.id as string } });
      if (!room) throw AppError.notFound('Consultorio no encontrado');
      const data = z.object({ isActive: z.boolean().optional() }).parse(req.body);
      const updated = await this.prisma.room.update({ where: { id: req.params.id as string }, data });
      res.json(successResponse(updated));
    } catch (err) { next(err); }
  };
}
