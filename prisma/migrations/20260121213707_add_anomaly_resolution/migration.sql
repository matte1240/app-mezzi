-- AlterTable
ALTER TABLE "VehicleLog" ADD COLUMN     "isResolved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "resolvedByMaintenanceId" TEXT;

-- AddForeignKey
ALTER TABLE "VehicleLog" ADD CONSTRAINT "VehicleLog_resolvedByMaintenanceId_fkey" FOREIGN KEY ("resolvedByMaintenanceId") REFERENCES "MaintenanceRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
