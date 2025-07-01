-- Add firstName and lastName columns
ALTER TABLE "User" ADD COLUMN "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN "lastName" TEXT;

-- Migrate existing name data to firstName
UPDATE "User" SET "firstName" = "name" WHERE "name" IS NOT NULL;

-- Drop the name column
ALTER TABLE "User" DROP COLUMN "name"; 