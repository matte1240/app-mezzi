-- AlterTable
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Vehicle' AND column_name = 'registrationDate') THEN
        ALTER TABLE "Vehicle" ADD COLUMN "registrationDate" TIMESTAMP(3);
    END IF;
END
$$;
