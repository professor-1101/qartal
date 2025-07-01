-- AlterTable
ALTER TABLE "Background" ADD COLUMN     "keyword" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Feature" ADD COLUMN     "slang" TEXT NOT NULL DEFAULT 'gherkin',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Scenario" ADD COLUMN     "keyword" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Step" ADD COLUMN     "argument" JSONB;

-- CreateTable
CREATE TABLE "Examples" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "header" JSONB,
    "body" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "Examples_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Examples" ADD CONSTRAINT "Examples_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
