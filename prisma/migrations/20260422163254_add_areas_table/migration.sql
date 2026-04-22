/*
  Warnings:

  - You are about to drop the column `area` on the `tasks` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "tasks_area_idx";

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "area",
ADD COLUMN     "area_id" TEXT;

-- CreateTable
CREATE TABLE "areas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "areas_name_key" ON "areas"("name");

-- CreateIndex
CREATE INDEX "areas_name_idx" ON "areas"("name");

-- CreateIndex
CREATE INDEX "tasks_area_id_idx" ON "tasks"("area_id");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
