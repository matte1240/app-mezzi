-- AlterTable
ALTER TABLE "RefuelingRecord" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "RefuelingRecord_userId_idx" ON "RefuelingRecord"("userId");

-- AddForeignKey
ALTER TABLE "RefuelingRecord" ADD CONSTRAINT "RefuelingRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
