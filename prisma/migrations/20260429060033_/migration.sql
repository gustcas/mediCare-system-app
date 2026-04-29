-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHERS');

-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('DNI', 'PASSPORT', 'CE', 'RUC', 'OTHER');

-- CreateEnum
CREATE TYPE "AppType" AS ENUM ('VIDEO', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "AppStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_DOCTOR', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AdmStatus" AS ENUM ('ADMITTED', 'DISCHARGED', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('LAB_REPORT', 'IMAGING', 'PRESCRIPTION_PDF', 'CONSENT_FORM', 'CLINICAL_SUMMARY', 'INSURANCE_DOC', 'OTHER');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('PENDING', 'AVAILABLE', 'REVIEWED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PrescStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FormType" AS ENUM ('ANAMNESIS', 'SATISFACTION', 'CONSENT', 'SCREENING', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('PENDING', 'PAID', 'PARTIALLY_PAID', 'INSURANCE_PENDING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VideoProvider" AS ENUM ('DAILY', 'TWILIO', 'AGORA', 'JITSI');

-- CreateEnum
CREATE TYPE "SlLanguage" AS ENUM ('LSP', 'ASL', 'BSL', 'OTHER');

-- CreateEnum
CREATE TYPE "SlSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SlSpeaker" AS ENUM ('PATIENT', 'DOCTOR');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "AllergySeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE', 'ANAPHYLACTIC');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'ACHIEVED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('CONSULTATION', 'EMERGENCY', 'LAB', 'OPERATING', 'WARD', 'IMAGING');

-- CreateEnum
CREATE TYPE "WardType" AS ENUM ('GENERAL', 'ICU', 'PEDIATRICS', 'MATERNITY', 'ONCOLOGY', 'CARDIOLOGY', 'SURGICAL', 'PSYCHIATRY', 'OTHER');

-- CreateEnum
CREATE TYPE "MedicationForm" AS ENUM ('TABLET', 'CAPSULE', 'SYRUP', 'INJECTABLE', 'PATCH', 'DROPS', 'CREAM', 'POWDER', 'SUPPOSITORY', 'INHALER', 'OTHER');

-- CreateEnum
CREATE TYPE "MedicationCategory" AS ENUM ('ANALGESIC', 'ANTIBIOTIC', 'ANTIHYPERTENSIVE', 'ANTIDIABETIC', 'ANTIHISTAMINE', 'ANTIDEPRESSANT', 'ANXIOLYTIC', 'ANTICOAGULANT', 'BRONCHODILATOR', 'ANTIEMETIC', 'IMMUNOSUPPRESSANT', 'OTHER');

-- CreateEnum
CREATE TYPE "LabCategory" AS ENUM ('HEMATOLOGY', 'BIOCHEMISTRY', 'MICROBIOLOGY', 'IMMUNOLOGY', 'ENDOCRINOLOGY', 'TOXICOLOGY', 'URINALYSIS', 'GENETIC', 'OTHER');

-- CreateEnum
CREATE TYPE "CarePlanItemType" AS ENUM ('MEDICATION', 'EXERCISE', 'DIET', 'PROCEDURE', 'FOLLOW_UP_APPOINTMENT', 'LAB_TEST', 'MONITORING', 'EDUCATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ContactRelationship" AS ENUM ('PARENT', 'SPOUSE', 'SIBLING', 'CHILD', 'GUARDIAN', 'FRIEND', 'OTHER');

-- CreateEnum
CREATE TYPE "DoctorSpecialtyType" AS ENUM ('PRIMARY', 'SUBSPECIALTY', 'CERTIFICATION');

-- CreateTable
CREATE TABLE "buildings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "district" TEXT,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'PE',
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "building_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floor" TEXT,
    "type" "RoomType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wards" (
    "id" TEXT NOT NULL,
    "building_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "WardType" NOT NULL,
    "floor" TEXT,
    "capacity" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "wards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specialties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "gender" "Gender" NOT NULL,
    "blood_type" "BloodType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_allergies" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "substance" TEXT NOT NULL,
    "severity" "AllergySeverity" NOT NULL,
    "reaction" TEXT,
    "confirmed_by" TEXT,
    "confirmed_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "patient_allergies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_contacts" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "relationship" "ContactRelationship" NOT NULL,
    "phone" TEXT NOT NULL,
    "phone_alt" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctors" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "license_number" TEXT NOT NULL,
    "bio" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_specialties" (
    "id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "specialty_id" TEXT NOT NULL,
    "type" "DoctorSpecialtyType" NOT NULL DEFAULT 'PRIMARY',
    "certified_at" DATE,
    "expires_at" DATE,

    CONSTRAINT "doctor_specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_availability" (
    "id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "day_of_week" "DayOfWeek" NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "building_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "doctor_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "room_id" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "type" "AppType" NOT NULL,
    "status" "AppStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT NOT NULL,
    "sl_enabled" BOOLEAN NOT NULL DEFAULT false,
    "cancel_reason" TEXT,
    "canceled_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admissions" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "ward_id" TEXT,
    "room_id" TEXT,
    "admitted_at" TIMESTAMP(3) NOT NULL,
    "discharged_at" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "status" "AdmStatus" NOT NULL,
    "admitted_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_notes" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "subjective" TEXT,
    "objective" TEXT,
    "assessment" TEXT,
    "plan" TEXT,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "locked_by" TEXT,
    "locked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnosis_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "version" TEXT NOT NULL,

    CONSTRAINT "diagnosis_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_diagnoses" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "diagnosis_code_id" TEXT NOT NULL,
    "diagnosed_by" TEXT NOT NULL,
    "diagnosed_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "patient_diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_note_diagnoses" (
    "id" TEXT NOT NULL,
    "clinical_note_id" TEXT NOT NULL,
    "diagnosis_code_id" TEXT NOT NULL,

    CONSTRAINT "clinical_note_diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_tests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "LabCategory" NOT NULL,
    "unit" TEXT,
    "reference_range_min" DECIMAL(65,30),
    "reference_range_max" DECIMAL(65,30),

    CONSTRAINT "lab_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_results" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "lab_test_id" TEXT NOT NULL,
    "ordered_by" TEXT NOT NULL,
    "appointment_id" TEXT,
    "status" "ResultStatus" NOT NULL DEFAULT 'PENDING',
    "result_date" TIMESTAMP(3),
    "values" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "clinical_note_id" TEXT,
    "type" "DocType" NOT NULL,
    "name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_result_documents" (
    "id" TEXT NOT NULL,
    "test_result_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "test_result_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "generic_name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_variants" (
    "id" TEXT NOT NULL,
    "medication_id" TEXT NOT NULL,
    "form" "MedicationForm" NOT NULL,
    "strength" TEXT NOT NULL,
    "category" "MedicationCategory" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "medication_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "clinical_note_id" TEXT,
    "issued_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "status" "PrescStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_items" (
    "id" TEXT NOT NULL,
    "prescription_id" TEXT NOT NULL,
    "medication_variant_id" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "instructions" TEXT,
    "refills_left" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_plans" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_plan_goals" (
    "id" TEXT NOT NULL,
    "care_plan_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'PENDING',
    "target_date" DATE,
    "achieved_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "care_plan_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_plan_items" (
    "id" TEXT NOT NULL,
    "care_plan_id" TEXT NOT NULL,
    "type" "CarePlanItemType" NOT NULL,
    "description" TEXT NOT NULL,
    "frequency" TEXT,
    "due_date" DATE,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "care_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forms" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "FormType" NOT NULL,
    "questions" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_responses" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "answers" JSONB NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_policies" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "policy_number" TEXT NOT NULL,
    "group_number" TEXT,
    "holder_name" TEXT NOT NULL,
    "coverage_type" TEXT NOT NULL,
    "valid_from" DATE NOT NULL,
    "valid_to" DATE NOT NULL,
    "copay_amount" DECIMAL(65,30),
    "deductible" DECIMAL(65,30),

    CONSTRAINT "insurance_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_records" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "insurance_policy_id" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "patient_owes" DECIMAL(65,30) NOT NULL,
    "status" "BillStatus" NOT NULL DEFAULT 'PENDING',
    "due_date" DATE,
    "paid_at" TIMESTAMP(3),
    "invoice_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_sessions" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "provider" "VideoProvider" NOT NULL,
    "room_url" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "recording_url" TEXT,

    CONSTRAINT "video_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sign_language_sessions" (
    "id" TEXT NOT NULL,
    "video_session_id" TEXT NOT NULL,
    "language" "SlLanguage" NOT NULL,
    "model_version" TEXT NOT NULL,
    "status" "SlSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "full_transcript" TEXT,
    "transcript_generated_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "sign_language_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sign_language_segments" (
    "id" TEXT NOT NULL,
    "sign_language_session_id" TEXT NOT NULL,
    "speaker" "SlSpeaker" NOT NULL,
    "detected_text" TEXT NOT NULL,
    "confidence" DECIMAL(65,30) NOT NULL,
    "timestamp_start_ms" INTEGER NOT NULL,
    "timestamp_end_ms" INTEGER NOT NULL,
    "raw_payload" JSONB,

    CONSTRAINT "sign_language_segments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "specialties_name_key" ON "specialties"("name");

-- CreateIndex
CREATE UNIQUE INDEX "patients_user_id_key" ON "patients"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_user_id_key" ON "doctors"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_license_number_key" ON "doctors"("license_number");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_specialties_doctor_id_specialty_id_key" ON "doctor_specialties"("doctor_id", "specialty_id");

-- CreateIndex
CREATE UNIQUE INDEX "diagnosis_codes_code_key" ON "diagnosis_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "clinical_note_diagnoses_clinical_note_id_diagnosis_code_id_key" ON "clinical_note_diagnoses"("clinical_note_id", "diagnosis_code_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_result_documents_test_result_id_document_id_key" ON "test_result_documents"("test_result_id", "document_id");

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wards" ADD CONSTRAINT "wards_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_allergies" ADD CONSTRAINT "patient_allergies_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_allergies" ADD CONSTRAINT "patient_allergies_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_specialties" ADD CONSTRAINT "doctor_specialties_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_specialties" ADD CONSTRAINT "doctor_specialties_specialty_id_fkey" FOREIGN KEY ("specialty_id") REFERENCES "specialties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_availability" ADD CONSTRAINT "doctor_availability_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_availability" ADD CONSTRAINT "doctor_availability_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_ward_id_fkey" FOREIGN KEY ("ward_id") REFERENCES "wards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_diagnoses" ADD CONSTRAINT "patient_diagnoses_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_diagnoses" ADD CONSTRAINT "patient_diagnoses_diagnosis_code_id_fkey" FOREIGN KEY ("diagnosis_code_id") REFERENCES "diagnosis_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_diagnoses" ADD CONSTRAINT "patient_diagnoses_diagnosed_by_fkey" FOREIGN KEY ("diagnosed_by") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_note_diagnoses" ADD CONSTRAINT "clinical_note_diagnoses_clinical_note_id_fkey" FOREIGN KEY ("clinical_note_id") REFERENCES "clinical_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_note_diagnoses" ADD CONSTRAINT "clinical_note_diagnoses_diagnosis_code_id_fkey" FOREIGN KEY ("diagnosis_code_id") REFERENCES "diagnosis_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_lab_test_id_fkey" FOREIGN KEY ("lab_test_id") REFERENCES "lab_tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_ordered_by_fkey" FOREIGN KEY ("ordered_by") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_clinical_note_id_fkey" FOREIGN KEY ("clinical_note_id") REFERENCES "clinical_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_result_documents" ADD CONSTRAINT "test_result_documents_test_result_id_fkey" FOREIGN KEY ("test_result_id") REFERENCES "test_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_result_documents" ADD CONSTRAINT "test_result_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_variants" ADD CONSTRAINT "medication_variants_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "medications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_clinical_note_id_fkey" FOREIGN KEY ("clinical_note_id") REFERENCES "clinical_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_medication_variant_id_fkey" FOREIGN KEY ("medication_variant_id") REFERENCES "medication_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_plans" ADD CONSTRAINT "care_plans_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_plans" ADD CONSTRAINT "care_plans_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_plan_goals" ADD CONSTRAINT "care_plan_goals_care_plan_id_fkey" FOREIGN KEY ("care_plan_id") REFERENCES "care_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_plan_items" ADD CONSTRAINT "care_plan_items_care_plan_id_fkey" FOREIGN KEY ("care_plan_id") REFERENCES "care_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_records" ADD CONSTRAINT "billing_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_records" ADD CONSTRAINT "billing_records_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_records" ADD CONSTRAINT "billing_records_insurance_policy_id_fkey" FOREIGN KEY ("insurance_policy_id") REFERENCES "insurance_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_sessions" ADD CONSTRAINT "video_sessions_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_language_sessions" ADD CONSTRAINT "sign_language_sessions_video_session_id_fkey" FOREIGN KEY ("video_session_id") REFERENCES "video_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_language_segments" ADD CONSTRAINT "sign_language_segments_sign_language_session_id_fkey" FOREIGN KEY ("sign_language_session_id") REFERENCES "sign_language_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
