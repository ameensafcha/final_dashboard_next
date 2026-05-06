import { z } from "zod";

export const createVariantSchema = z.object({
  product_id: z.string({ required_error: "Product ID is required" }).uuid(),
  size_id: z.string({ required_error: "Size ID is required" }).uuid(),
  flavor_id: z.string({ required_error: "Flavor ID is required" }).uuid(),
  sku: z
    .string({ required_error: "SKU is required" })
    .min(1, "SKU cannot be empty"),
  price: z.preprocess(
    (val) => (typeof val === "string" ? parseFloat(val) : val),
    z
      .number({ invalid_type_error: "Price must be a number" })
      .min(0, "Price cannot be negative"),
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
  id: z.string({ required_error: "ID is required" }).uuid(),
  price: z
    .preprocess(
      (val) => (typeof val === "string" ? parseFloat(val) : val),
      z
        .number({ invalid_type_error: "Price must be a number" })
        .min(0, "Price cannot be negative"),
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
