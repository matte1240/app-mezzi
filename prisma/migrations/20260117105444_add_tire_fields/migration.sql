-- CreateEnum
CREATE TYPE "TireType" AS ENUM ('ESTIVE', 'INVERNALI', 'QUATTRO_STAGIONI');

-- AlterTable
ALTER TABLE "MaintenanceRecord" ADD COLUMN     "tireStorageLocation" TEXT,
ADD COLUMN     "tireType" "TireType";
