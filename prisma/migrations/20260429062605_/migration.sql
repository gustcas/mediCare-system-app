-- AlterTable: make user_id optional and add clinical patient fields
ALTER TABLE "patients" ALTER COLUMN "user_id" DROP NOT NULL;

ALTER TABLE "patients"
  ADD COLUMN "first_name"      TEXT NOT NULL DEFAULT '',
  ADD COLUMN "last_name"       TEXT NOT NULL DEFAULT '',
  ADD COLUMN "document_type"   "DocumentType",
  ADD COLUMN "document_number" TEXT,
  ADD COLUMN "phone"           TEXT,
  ADD COLUMN "address"         TEXT;

-- Remove temporary defaults (columns already have data from DEFAULT)
ALTER TABLE "patients"
  ALTER COLUMN "first_name" DROP DEFAULT,
  ALTER COLUMN "last_name"  DROP DEFAULT;

-- Unique constraint on document_number
ALTER TABLE "patients"
  ADD CONSTRAINT "patients_document_number_key" UNIQUE ("document_number");
