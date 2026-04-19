/*
  Warnings:

  - You are about to drop the `permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `route_permissions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey (IF EXISTS — production me already nahi hain)
ALTER TABLE IF EXISTS "role_permissions" DROP CONSTRAINT IF EXISTS "role_permissions_permission_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "role_permissions" DROP CONSTRAINT IF EXISTS "role_permissions_role_id_fkey";

-- AlterTable (IF NOT EXISTS — production me already hain)
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "company_id" TEXT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "estimated_hours" DOUBLE PRECISION;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "has_spawned_recurrence" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "recurrence" TEXT;

-- DropTable (IF EXISTS — production me already nahi hain)
DROP TABLE IF EXISTS "permissions";
DROP TABLE IF EXISTS "role_permissions";
DROP TABLE IF EXISTS "route_permissions";

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_attachments" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER,
    "file_type" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_plans" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "plan_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER NOT NULL DEFAULT 0,
    "tomorrow_notes" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_items" (
    "id" TEXT NOT NULL,
    "daily_plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "biz" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "blocker_reason" TEXT,
    "action_owner" TEXT,
    "carryover_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "daily_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_blockers" (
    "id" TEXT NOT NULL,
    "daily_plan_id" TEXT NOT NULL,
    "blocker_text" TEXT NOT NULL,
    "action_owner" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "daily_blockers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_table" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_table_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");

-- CreateIndex
CREATE INDEX "task_attachments_task_id_idx" ON "task_attachments"("task_id");

-- CreateIndex
CREATE INDEX "daily_plans_employee_id_idx" ON "daily_plans"("employee_id");

-- CreateIndex
CREATE INDEX "daily_plans_plan_date_idx" ON "daily_plans"("plan_date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_plans_plan_date_employee_id_key" ON "daily_plans"("plan_date", "employee_id");

-- CreateIndex
CREATE INDEX "daily_items_daily_plan_id_idx" ON "daily_items"("daily_plan_id");

-- CreateIndex
CREATE INDEX "daily_items_status_idx" ON "daily_items"("status");

-- CreateIndex
CREATE INDEX "daily_blockers_daily_plan_id_idx" ON "daily_blockers"("daily_plan_id");

-- CreateIndex
CREATE INDEX "tasks_company_id_idx" ON "tasks"("company_id");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_plans" ADD CONSTRAINT "daily_plans_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_items" ADD CONSTRAINT "daily_items_daily_plan_id_fkey" FOREIGN KEY ("daily_plan_id") REFERENCES "daily_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_blockers" ADD CONSTRAINT "daily_blockers_daily_plan_id_fkey" FOREIGN KEY ("daily_plan_id") REFERENCES "daily_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
