-- CreateEnum
CREATE TYPE "OwnershipType" AS ENUM ('OWNED', 'RENTAL');

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "ownershipType" "OwnershipType" NOT NULL DEFAULT 'OWNED';

-- CreateTable
CREATE TABLE "MileageCheck" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "km" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MileageCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MileageCheck_vehicleId_idx" ON "MileageCheck"("vehicleId");

-- CreateIndex
CREATE INDEX "MileageCheck_userId_idx" ON "MileageCheck"("userId");

-- AddForeignKey
ALTER TABLE "MileageCheck" ADD CONSTRAINT "MileageCheck_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MileageCheck" ADD CONSTRAINT "MileageCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
