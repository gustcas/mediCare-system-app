import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding medical database...');

  // Specialties
  const specialties = await Promise.all([
    prisma.specialty.upsert({ where: { name: 'Cardiología' }, update: {}, create: { name: 'Cardiología', description: 'Enfermedades del corazón' } }),
    prisma.specialty.upsert({ where: { name: 'Pediatría' }, update: {}, create: { name: 'Pediatría', description: 'Atención médica de niños' } }),
    prisma.specialty.upsert({ where: { name: 'Medicina General' }, update: {}, create: { name: 'Medicina General', description: 'Atención primaria' } }),
    prisma.specialty.upsert({ where: { name: 'Neurología' }, update: {}, create: { name: 'Neurología', description: 'Enfermedades del sistema nervioso' } }),
    prisma.specialty.upsert({ where: { name: 'Dermatología' }, update: {}, create: { name: 'Dermatología', description: 'Enfermedades de la piel' } }),
    prisma.specialty.upsert({ where: { name: 'Traumatología' }, update: {}, create: { name: 'Traumatología', description: 'Sistema musculoesquelético' } }),
  ]);

  // Building
  const building = await prisma.building.upsert({
    where: { id: 'b1000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'b1000000-0000-0000-0000-000000000001',
      name: 'Edificio Principal',
      address: 'Av. Salud 123',
      city: 'Lima',
      country: 'PE',
    },
  });

  // Rooms
  await Promise.all([
    prisma.room.upsert({ where: { id: 'r1000000-0000-0000-0000-000000000001' }, update: {}, create: { id: 'r1000000-0000-0000-0000-000000000001', buildingId: building.id, name: 'Consultorio 1', type: 'CONSULTATION', floor: '1' } }),
    prisma.room.upsert({ where: { id: 'r1000000-0000-0000-0000-000000000002' }, update: {}, create: { id: 'r1000000-0000-0000-0000-000000000002', buildingId: building.id, name: 'Consultorio 2', type: 'CONSULTATION', floor: '1' } }),
    prisma.room.upsert({ where: { id: 'r1000000-0000-0000-0000-000000000003' }, update: {}, create: { id: 'r1000000-0000-0000-0000-000000000003', buildingId: building.id, name: 'Urgencias', type: 'EMERGENCY', floor: 'PB' } }),
  ]);

  // Diagnosis codes (CIE-10 sample)
  const diagnosisCodes = [
    { code: 'J06.9', description: 'Infección aguda de las vías respiratorias superiores', category: 'Respiratorio', version: 'CIE-10' },
    { code: 'I10', description: 'Hipertensión esencial', category: 'Cardiovascular', version: 'CIE-10' },
    { code: 'E11.9', description: 'Diabetes mellitus tipo 2', category: 'Endocrino', version: 'CIE-10' },
    { code: 'M54.5', description: 'Lumbalgia', category: 'Musculoesquelético', version: 'CIE-10' },
    { code: 'K21.0', description: 'Enfermedad por reflujo gastroesofágico con esofagitis', category: 'Digestivo', version: 'CIE-10' },
  ];

  for (const d of diagnosisCodes) {
    await prisma.diagnosisCode.upsert({ where: { code: d.code }, update: {}, create: d });
  }

  // Lab tests
  const labTests = [
    { name: 'Hemograma completo', category: 'HEMATOLOGY' as const, unit: 'células/mm³' },
    { name: 'Glucosa en ayunas', category: 'BIOCHEMISTRY' as const, unit: 'mg/dL', referenceRangeMin: 70, referenceRangeMax: 100 },
    { name: 'Creatinina', category: 'BIOCHEMISTRY' as const, unit: 'mg/dL', referenceRangeMin: 0.7, referenceRangeMax: 1.3 },
    { name: 'Hemoglobina glicosilada', category: 'ENDOCRINOLOGY' as const, unit: '%' },
    { name: 'Urocultivo', category: 'MICROBIOLOGY' as const },
  ];

  for (const lt of labTests) {
    const existing = await prisma.labTest.findFirst({ where: { name: lt.name } });
    if (!existing) await prisma.labTest.create({ data: lt as any });
  }

  // Medications
  const medications = [
    { name: 'Paracetamol', genericName: 'Acetaminofén' },
    { name: 'Amoxicilina', genericName: 'Amoxicillin' },
    { name: 'Ibuprofeno', genericName: 'Ibuprofeno' },
    { name: 'Metformina', genericName: 'Metformin' },
    { name: 'Losartán', genericName: 'Losartan' },
  ];

  for (const med of medications) {
    const existing = await prisma.medication.findFirst({ where: { name: med.name } });
    if (!existing) {
      const m = await prisma.medication.create({ data: med });
      await prisma.medicationVariant.create({
        data: { medicationId: m.id, form: 'TABLET', strength: '500mg', category: 'ANALGESIC' },
      });
    }
  }

  console.log('✅ Medical seed completado');
  console.log(`   ${specialties.length} especialidades`);
  console.log(`   ${diagnosisCodes.length} códigos de diagnóstico`);
  console.log(`   ${labTests.length} pruebas de laboratorio`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
