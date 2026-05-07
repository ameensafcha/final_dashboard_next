import { z } from "zod";

export const createVariantSchema = z.object({
  product_id: z.string().uuid({ error: "Product ID is required" }),
  size_id: z.string().uuid({ error: "Size ID is required" }),
  flavor_id: z.string().uuid({ error: "Flavor ID is required" }),
  sku: z.string().min(1, { error: "SKU cannot be empty" }),
  price: z.preprocess(
    (val) => (typeof val === "string" ? parseFloat(val) : val),
    z.number({ error: "Price must be a number" }).min(0, { error: "Price cannot be negative" }),
  ),
  is_active: z.boolean().optional().default(true),
  description: z.string().optional().nullable(),
  grade: z.string().optional().default("STD"),
  name_arabic: z.string().optional().nullable(),
  nutritional_values: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  sfda_reg_no: z.string().optional().nullable(),
  shelf_life_months: z.preprocess(
    (val) => (typeof val === "string" ? parseInt(val) : val),
    z.number().int().positive().optional().nullable(),
  ),
  storage_instructions: z.string().optional().nullable(),
});

export const updateVariantSchema = z.object({
  id: z.string().uuid({ error: "ID is required" }),
  price: z
    .preprocess(
      (val) => (typeof val === "string" ? parseFloat(val) : val),
      z.number({ error: "Price must be a number" }).min(0, { error: "Price cannot be negative" }),
    )
    .optional(),
  is_active: z.boolean().optional(),
  description: z.string().optional().nullable(),
  name_arabic: z.string().optional().nullable(),
  nutritional_values: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  sfda_reg_no: z.string().optional().nullable(),
  shelf_life_months: z
    .preprocess(
      (val) => (typeof val === "string" ? parseInt(val) : val),
      z.number().int().positive().optional().nullable(),
    )
    .optional(),
  storage_instructions: z.string().optional().nullable(),
});

export const bulkVariantSchema = z.object({
  variants: z.array(
    z.object({
      product_id: z.string().uuid(),
      size_id: z.string().uuid(),
      flavor_id: z.string().uuid(),
      sku: z.string().min(1),
      price: z.preprocess(
        (val) => (typeof val === "string" ? parseFloat(val) : val),
        z.number().min(0),
      ),
      is_active: z.boolean().optional().default(true),
      grade: z.string().optional().default("STD"),
    }),
  ),
});
