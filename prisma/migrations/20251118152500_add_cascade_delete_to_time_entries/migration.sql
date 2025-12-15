-- AlterTable: Update TimeEntry foreign key constraint to use CASCADE on delete
-- This allows users to be deleted even if they have time entries

-- Drop existing constraint
ALTER TABLE "TimeEntry" DROP CONSTRAINT "TimeEntry_userId_fkey";

-- Add new constraint with CASCADE
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
