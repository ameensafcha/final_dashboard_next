-- SUPABASE FULL SCHEMA EXPORT
-- Generated for import into another Supabase project

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES (Generated from Prisma)

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable roles
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable employees
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "role_id" TEXT,
    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable raw_materials
CREATE TABLE "raw_materials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "price_per_kg" DOUBLE PRECISION,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    CONSTRAINT "raw_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable receiving_materials
CREATE TABLE "receiving_materials" (
    "id" TEXT NOT NULL,
    "raw_material_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION,
    "supplier" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    CONSTRAINT "receiving_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable flavors
CREATE TABLE "flavors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_code" TEXT NOT NULL DEFAULT 'XX',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ingredients" TEXT,
    CONSTRAINT "flavors_pkey" PRIMARY KEY ("id")
);

-- CreateTable products
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable product_variants
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "size_id" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sku" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "flavor_id" TEXT NOT NULL,
    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable product_flavors
CREATE TABLE "product_flavors" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "flavor_id" TEXT NOT NULL,
    CONSTRAINT "product_flavors_pkey" PRIMARY KEY ("id")
);

-- CreateTable sizes
CREATE TABLE "sizes" (
    "id" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "pack_type" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable transactions
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference_id" TEXT,
    "person_id" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable batches
CREATE TABLE "batches" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logged_by" TEXT NOT NULL,
    "flavor_id" TEXT NOT NULL,
    "leaves_in" DOUBLE PRECISION NOT NULL,
    "powder_out" DOUBLE PRECISION NOT NULL,
    "waste_loss" DOUBLE PRECISION NOT NULL,
    "yield_percent" DOUBLE PRECISION NOT NULL,
    "quality_check" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw_material_id" TEXT,
    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable raw_material_logs
CREATE TABLE "raw_material_logs" (
    "id" TEXT NOT NULL,
    "raw_material_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "reference_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "raw_material_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable finished_products
CREATE TABLE "finished_products" (
    "id" TEXT NOT NULL,
    "flavor_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "batch_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "finished_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable packing_logs
CREATE TABLE "packing_logs" (
    "id" TEXT NOT NULL,
    "third_party_name" TEXT NOT NULL,
    "bag_size" INTEGER NOT NULL,
    "bag_count" INTEGER NOT NULL,
    "total_kg" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "packing_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable raw_material_stock
CREATE TABLE "raw_material_stock" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "price_per_kg" DOUBLE PRECISION,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "raw_material_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable product_stock
CREATE TABLE "product_stock" (
    "variant_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_stock_pkey" PRIMARY KEY ("variant_id")
);

-- CreateTable powder_stock
CREATE TABLE "powder_stock" (
    "id" SERIAL NOT NULL,
    "received" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_from_batches" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_sent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "available" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "powder_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable packing_receives
CREATE TABLE "packing_receives" (
    "id" TEXT NOT NULL,
    "third_party_name" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "packing_receives_pkey" PRIMARY KEY ("id")
);

-- CreateTable packing_receive_items
CREATE TABLE "packing_receive_items" (
    "id" TEXT NOT NULL,
    "packing_receive_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "packing_receive_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable variant_inventory
CREATE TABLE "variant_inventory" (
    "id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "variant_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable companies
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable tasks
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "area" TEXT,
    "company_id" TEXT,
    "assignee_id" TEXT,
    "created_by" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "due_date" TIMESTAMP(3),
    "start_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "estimated_hours" DOUBLE PRECISION,
    "recurrence" TEXT,
    "has_spawned_recurrence" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable task_attachments
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

-- CreateTable subtasks
CREATE TABLE "subtasks" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subtasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable task_comments
CREATE TABLE "task_comments" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable notifications
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "task_title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable app_settings
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable task_time_logs
CREATE TABLE "task_time_logs" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "task_time_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable DailyPlan
CREATE TABLE "DailyPlan" (
    "id" TEXT NOT NULL,
    "plan_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "final_score" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "DailyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable DailyItem
CREATE TABLE "DailyItem" (
    "id" TEXT NOT NULL,
    "daily_plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "biz" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "carryover_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "DailyItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable DailyBlocker
CREATE TABLE "DailyBlocker" (
    "id" TEXT NOT NULL,
    "daily_plan_id" TEXT NOT NULL,
    "blocker_text" TEXT NOT NULL,
    "action_owner" TEXT,
    CONSTRAINT "DailyBlocker_pkey" PRIMARY KEY ("id")
);

-- CreateTable TomorrowNotes
CREATE TABLE "TomorrowNotes" (
    "id" TEXT NOT NULL,
    "notes" TEXT[],
    "daily_plan_id" TEXT NOT NULL,
    CONSTRAINT "TomorrowNotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");
CREATE INDEX "roles_name_idx" ON "roles"("name");
CREATE INDEX "roles_is_active_idx" ON "roles"("is_active");
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");
CREATE INDEX "employees_email_idx" ON "employees"("email");
CREATE INDEX "employees_role_id_idx" ON "employees"("role_id");
CREATE INDEX "employees_is_active_idx" ON "employees"("is_active");
CREATE INDEX "raw_materials_name_idx" ON "raw_materials"("name");
CREATE INDEX "receiving_materials_raw_material_id_idx" ON "receiving_materials"("raw_material_id");
CREATE INDEX "receiving_materials_date_idx" ON "receiving_materials"("date" DESC);
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");
CREATE INDEX "product_variants_is_active_idx" ON "product_variants"("is_active");
CREATE UNIQUE INDEX "product_variants_product_id_flavor_id_size_id_key" ON "product_variants"("product_id", "flavor_id", "size_id");
CREATE UNIQUE INDEX "product_flavors_product_id_flavor_id_key" ON "product_flavors"("product_id", "flavor_id");
CREATE INDEX "transactions_type_idx" ON "transactions"("type");
CREATE INDEX "transactions_date_idx" ON "transactions"("date" DESC);
CREATE INDEX "transactions_person_id_idx" ON "transactions"("person_id");
CREATE UNIQUE INDEX "batches_batch_id_key" ON "batches"("batch_id");
CREATE INDEX "batches_status_idx" ON "batches"("status");
CREATE INDEX "batches_created_at_idx" ON "batches"("created_at" DESC);
CREATE INDEX "batches_flavor_id_idx" ON "batches"("flavor_id");
CREATE INDEX "batches_logged_by_idx" ON "batches"("logged_by");
CREATE INDEX "raw_material_logs_raw_material_id_idx" ON "raw_material_logs"("raw_material_id");
CREATE INDEX "raw_material_logs_created_at_idx" ON "raw_material_logs"("created_at" DESC);
CREATE INDEX "finished_products_created_at_idx" ON "finished_products"("created_at" DESC);
CREATE INDEX "finished_products_flavor_id_idx" ON "finished_products"("flavor_id");
CREATE INDEX "packing_logs_created_at_idx" ON "packing_logs"("created_at" DESC);
CREATE INDEX "packing_receives_created_at_idx" ON "packing_receives"("created_at" DESC);
CREATE UNIQUE INDEX "variant_inventory_variant_id_key" ON "variant_inventory"("variant_id");
CREATE INDEX "variant_inventory_quantity_idx" ON "variant_inventory"("quantity" DESC);
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");
CREATE INDEX "tasks_status_idx" ON "tasks"("status");
CREATE INDEX "tasks_assignee_id_idx" ON "tasks"("assignee_id");
CREATE INDEX "tasks_priority_idx" ON "tasks"("priority");
CREATE INDEX "tasks_due_date_idx" ON "tasks"("due_date");
CREATE INDEX "tasks_created_by_idx" ON "tasks"("created_by");
CREATE INDEX "tasks_area_idx" ON "tasks"("area");
CREATE INDEX "tasks_company_id_idx" ON "tasks"("company_id");
CREATE INDEX "task_attachments_task_id_idx" ON "task_attachments"("task_id");
CREATE INDEX "subtasks_task_id_idx" ON "subtasks"("task_id");
CREATE INDEX "task_comments_task_id_idx" ON "task_comments"("task_id");
CREATE INDEX "task_comments_employee_id_idx" ON "task_comments"("employee_id");
CREATE INDEX "notifications_recipient_id_created_at_idx" ON "notifications"("recipient_id", "created_at" DESC);
CREATE INDEX "notifications_task_id_idx" ON "notifications"("task_id");
CREATE INDEX "task_time_logs_task_id_idx" ON "task_time_logs"("task_id");
CREATE INDEX "task_time_logs_employee_id_idx" ON "task_time_logs"("employee_id");
CREATE UNIQUE INDEX "DailyPlan_plan_date_key" ON "DailyPlan"("plan_date");
CREATE UNIQUE INDEX "TomorrowNotes_daily_plan_id_key" ON "TomorrowNotes"("daily_plan_id");

-- 3. FOREIGN KEYS
ALTER TABLE "employees" ADD CONSTRAINT "employees_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "receiving_materials" ADD CONSTRAINT "receiving_materials_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_flavor_id_fkey" FOREIGN KEY ("flavor_id") REFERENCES "flavors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "sizes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_flavors" ADD CONSTRAINT "product_flavors_flavor_id_fkey" FOREIGN KEY ("flavor_id") REFERENCES "flavors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_flavors" ADD CONSTRAINT "product_flavors_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "batches" ADD CONSTRAINT "batches_logged_by_fkey" FOREIGN KEY ("logged_by") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "batches" ADD CONSTRAINT "batches_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "batches" ADD CONSTRAINT "batches_flavor_id_fkey" FOREIGN KEY ("flavor_id") REFERENCES "flavors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "raw_material_logs" ADD CONSTRAINT "raw_material_logs_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "finished_products" ADD CONSTRAINT "finished_products_flavor_id_fkey" FOREIGN KEY ("flavor_id") REFERENCES "flavors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_stock" ADD CONSTRAINT "product_stock_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "packing_receive_items" ADD CONSTRAINT "packing_receive_items_packing_receive_id_fkey" FOREIGN KEY ("packing_receive_id") REFERENCES "packing_receives"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "packing_receive_items" ADD CONSTRAINT "packing_receive_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "variant_inventory" ADD CONSTRAINT "variant_inventory_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subtasks" ADD CONSTRAINT "subtasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_time_logs" ADD CONSTRAINT "task_time_logs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task_time_logs" ADD CONSTRAINT "task_time_logs_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyItem" ADD CONSTRAINT "DailyItem_daily_plan_id_fkey" FOREIGN KEY ("daily_plan_id") REFERENCES "DailyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyBlocker" ADD CONSTRAINT "DailyBlocker_daily_plan_id_fkey" FOREIGN KEY ("daily_plan_id") REFERENCES "DailyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TomorrowNotes" ADD CONSTRAINT "TomorrowNotes_daily_plan_id_fkey" FOREIGN KEY ("daily_plan_id") REFERENCES "DailyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. SUPABASE SPECIFIC (Realtime & RLS)

-- Enable Realtime for specific tables
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER TABLE DailyItem REPLICA IDENTITY FULL;

-- Note: RLS is currently DISABLED on key tables based on project state
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
