/*
  Warnings:

  - A unique constraint covering the columns `[product_id,flavor_id,size_id,grade]` on the table `product_variants` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "product_variants_product_id_flavor_id_size_id_key";

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "grade" TEXT NOT NULL DEFAULT 'STD',
ADD COLUMN     "mesh_size" TEXT,
ADD COLUMN     "name_arabic" TEXT,
ADD COLUMN     "nutritional_values" TEXT,
ADD COLUMN     "sfda_reg_no" TEXT,
ADD COLUMN     "shelf_life_months" INTEGER,
ADD COLUMN     "storage_instructions" TEXT;

-- CreateTable
CREATE TABLE "product_batches" (
    "id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "manufacturing_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "packaging_state" TEXT NOT NULL DEFAULT 'raw',
    "location" TEXT NOT NULL DEFAULT 'factory',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_batches_batch_id_key" ON "product_batches"("batch_id");

-- CreateIndex
CREATE INDEX "product_batches_variant_id_idx" ON "product_batches"("variant_id");

-- CreateIndex
CREATE INDEX "product_batches_expiry_date_idx" ON "product_batches"("expiry_date");

-- CreateIndex
CREATE INDEX "product_variants_grade_idx" ON "product_variants"("grade");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_product_id_flavor_id_size_id_grade_key" ON "product_variants"("product_id", "flavor_id", "size_id", "grade");

-- AddForeignKey
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
