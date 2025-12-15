-- CreateTable
CREATE TABLE IF NOT EXISTS "VehicleLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "initialKm" INTEGER NOT NULL,
    "finalKm" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VehicleLog_userId_idx" ON "VehicleLog"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VehicleLog_vehicleId_idx" ON "VehicleLog"("vehicleId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VehicleLog_date_idx" ON "VehicleLog"("date");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'VehicleLog_userId_fkey') THEN
        ALTER TABLE "VehicleLog" ADD CONSTRAINT "VehicleLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'VehicleLog_vehicleId_fkey') THEN
        ALTER TABLE "VehicleLog" ADD CONSTRAINT "VehicleLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;
