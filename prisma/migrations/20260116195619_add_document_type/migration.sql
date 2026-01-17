-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('LIBRETTO_CIRCOLAZIONE', 'ASSICURAZIONE', 'ALTRO');

-- AlterTable
ALTER TABLE "VehicleDocument" ADD COLUMN     "documentType" "DocumentType" NOT NULL DEFAULT 'ALTRO';
