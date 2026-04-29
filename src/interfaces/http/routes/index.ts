import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../infrastructure/middleware/authMiddleware';
import { PatientController }        from '../controllers/PatientController';
import { DoctorController }         from '../controllers/DoctorController';
import { AppointmentController }    from '../controllers/AppointmentController';
import { ClinicalNoteController }   from '../controllers/ClinicalNoteController';
import { PrescriptionController }   from '../controllers/PrescriptionController';
import { LabController }            from '../controllers/LabController';
import { BillingController }        from '../controllers/BillingController';
import { DashboardController }      from '../controllers/DashboardController';
import { AdmissionController }      from '../controllers/AdmissionController';
import { CarePlanController }       from '../controllers/CarePlanController';
import { InsurancePolicyController } from '../controllers/InsurancePolicyController';
import { DiagnosisController }      from '../controllers/DiagnosisController';
import { FacilityController }       from '../controllers/FacilityController';
import { MedicationController }     from '../controllers/MedicationController';
import { DocumentController }       from '../controllers/DocumentController';

export function createRouter(prisma: PrismaClient): Router {
  const router = Router();
  router.use(authenticate);

  const patients    = new PatientController(prisma);
  const doctors     = new DoctorController(prisma);
  const appointments= new AppointmentController(prisma);
  const notes       = new ClinicalNoteController(prisma);
  const prescriptions = new PrescriptionController(prisma);
  const lab         = new LabController(prisma);
  const billing     = new BillingController(prisma);
  const dashboard   = new DashboardController(prisma);
  const admissions  = new AdmissionController(prisma);
  const carePlans   = new CarePlanController(prisma);
  const insurance   = new InsurancePolicyController(prisma);
  const diagnosis   = new DiagnosisController(prisma);
  const facility    = new FacilityController(prisma);
  const medications = new MedicationController(prisma);
  const documents   = new DocumentController(prisma);

  // ── Dashboard ──────────────────────────────────────────────────────────────
  router.get('/dashboard/summary', dashboard.getSummary);

  // ── Patients ───────────────────────────────────────────────────────────────
  router.get   ('/patients',                            patients.list);
  router.get   ('/patients/:id',                        patients.getById);
  router.post  ('/patients',                            patients.create);
  router.put   ('/patients/:id',                        patients.update);
  router.delete('/patients/:id',                        patients.delete);
  router.get   ('/patients/:id/allergies',              patients.getAllergies);
  router.post  ('/patients/:id/allergies',              patients.createAllergy);
  router.get   ('/patients/:id/emergency-contacts',     patients.getEmergencyContacts);
  router.post  ('/patients/:id/emergency-contacts',     patients.createEmergencyContact);
  router.get   ('/patients/:patientId/admissions',      admissions.getByPatient);
  router.get   ('/patients/:patientId/care-plans',      carePlans.getByPatient);
  router.get   ('/patients/:patientId/insurance',       insurance.getByPatient);
  router.get   ('/patients/:patientId/diagnoses',       diagnosis.getByPatient);
  router.post  ('/patients/:patientId/diagnoses',       diagnosis.create);
  router.get   ('/patients/:patientId/documents',       documents.getByPatient);
  router.get   ('/patients/:patientId/billing',         billing.getByPatient);
  router.get   ('/patients/:patientId/lab-results',     lab.getResultsByPatient);
  router.get   ('/patients/:patientId/prescriptions',   prescriptions.getByPatient);

  // ── Doctors ───────────────────────────────────────────────────────────────
  router.get('/doctors',                          doctors.list);
  router.get('/doctors/:id',                      doctors.getById);
  router.post('/doctors',                         doctors.create);
  router.put('/doctors/:id',                      doctors.update);
  router.put('/doctors/:id/availability',         doctors.setAvailability);

  // ── Appointments ──────────────────────────────────────────────────────────
  router.get   ('/appointments',                        appointments.list);
  router.get   ('/appointments/check-availability',     appointments.checkAvailability);
  router.get   ('/appointments/:id',                    appointments.getById);
  router.post  ('/appointments',                        appointments.create);
  router.patch ('/appointments/:id/status',             appointments.changeStatus);

  // ── Clinical Notes ────────────────────────────────────────────────────────
  router.get   ('/appointments/:appointmentId/notes',   notes.getByAppointment);
  router.post  ('/clinical-notes',                      notes.create);
  router.put   ('/clinical-notes/:id',                  notes.update);
  router.patch ('/clinical-notes/:id/lock',             notes.lock);

  // ── Admissions ────────────────────────────────────────────────────────────
  router.get   ('/admissions',                          admissions.list);
  router.get   ('/admissions/:id',                      admissions.getById);
  router.post  ('/admissions',                          admissions.create);
  router.patch ('/admissions/:id/discharge',            admissions.discharge);

  // ── Care Plans ────────────────────────────────────────────────────────────
  router.get   ('/care-plans',                          carePlans.list);
  router.get   ('/care-plans/:id',                      carePlans.getById);
  router.post  ('/care-plans',                          carePlans.create);
  router.patch ('/care-plans/:id/status',               carePlans.updateStatus);
  router.patch ('/care-plans/:id/goals/:goalId',        carePlans.updateGoalProgress);

  // ── Insurance ─────────────────────────────────────────────────────────────
  router.get   ('/insurance',                           insurance.list);
  router.post  ('/insurance',                           insurance.create);
  router.put   ('/insurance/:id',                       insurance.update);
  router.delete('/insurance/:id',                       insurance.delete);

  // ── Diagnosis ─────────────────────────────────────────────────────────────
  router.get   ('/diagnosis-codes',                     diagnosis.searchCodes);
  router.patch ('/diagnoses/:id',                       diagnosis.update);

  // ── Prescriptions ─────────────────────────────────────────────────────────
  router.get   ('/prescriptions/list',                  prescriptions.list);
  router.post  ('/prescriptions',                       prescriptions.create);
  router.patch ('/prescriptions/:id/status',            prescriptions.updateStatus);

  // ── Lab ───────────────────────────────────────────────────────────────────
  router.get   ('/lab-tests',                           lab.listTests);
  router.get   ('/lab-results/list',                    lab.listResults);
  router.post  ('/lab-results',                         lab.createResult);
  router.patch ('/lab-results/:id/status',              lab.updateResultStatus);

  // ── Billing ───────────────────────────────────────────────────────────────
  router.get   ('/billing/list',                        billing.list);
  router.post  ('/billing',                             billing.create);
  router.patch ('/billing/:id/status',                  billing.updateStatus);

  // ── Medications ───────────────────────────────────────────────────────────
  router.get   ('/medications',                         medications.list);
  router.get   ('/medications/:id',                     medications.getById);
  router.post  ('/medications',                         medications.create);
  router.put   ('/medications/:id',                     medications.update);
  router.patch ('/medications/:id/variants/:variantId/deactivate', medications.deactivateVariant);

  // ── Documents ─────────────────────────────────────────────────────────────
  router.post  ('/documents',                           documents.create);
  router.delete('/documents/:id',                       documents.delete);

  // ── Facility ──────────────────────────────────────────────────────────────
  router.get   ('/specialties',                         facility.listSpecialties);
  router.post  ('/specialties',                         facility.createSpecialty);
  router.put   ('/specialties/:id',                     facility.updateSpecialty);
  router.get   ('/buildings',                           facility.listBuildings);
  router.post  ('/buildings',                           facility.createBuilding);
  router.get   ('/wards',                               facility.listWards);
  router.post  ('/wards',                               facility.createWard);
  router.get   ('/rooms',                               facility.listRooms);
  router.post  ('/rooms',                               facility.createRoom);
  router.put   ('/rooms/:id',                           facility.updateRoom);

  return router;
}
