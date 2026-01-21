-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "currentAnomaly" TEXT;

-- AlterTable
ALTER TABLE "VehicleLog" ADD COLUMN     "anomalyDescription" TEXT,
ADD COLUMN     "hasAnomaly" BOOLEAN NOT NULL DEFAULT false;
