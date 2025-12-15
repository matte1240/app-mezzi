-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MaintenanceType') THEN
        CREATE TYPE "MaintenanceType" AS ENUM ('TAGLIANDO', 'GOMME', 'MECCANICA', 'REVISIONE', 'ALTRO');
    END IF;
END
$$;

-- AlterTable
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Vehicle' AND column_name = 'serviceIntervalKm') THEN
        ALTER TABLE "Vehicle" ADD COLUMN "serviceIntervalKm" INTEGER NOT NULL DEFAULT 15000;
    END IF;
END
$$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "MaintenanceRecord" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "cost" DECIMAL(10,2),
    "mileage" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MaintenanceRecord_vehicleId_idx" ON "MaintenanceRecord"("vehicleId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MaintenanceRecord_date_idx" ON "MaintenanceRecord"("date");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MaintenanceRecord_vehicleId_fkey') THEN
        ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;
