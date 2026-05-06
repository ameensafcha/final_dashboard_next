import { z } from "zod";

export const flavorSchema = z.object({
  name: z.string({ required_error: "Name is required" }).min(2, "Name must be at least 2 characters"),
  short_code: z.string({ required_error: "Short code is required" })
    .min(2, "Code must be at least 2 characters")
    .max(3, "Code cannot exceed 3 characters")
    .transform(val => val.toUpperCase()),
  ingredients: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

// lib/validations/flavor.ts
export const updateFlavorSchema = z.object({
  id: z.string({ required_error: "ID is required" }).uuid(),
  name: z.string().min(2).optional(),
  short_code: z.string().min(2).max(3).optional().transform(val => val?.toUpperCase()),
  ingredients: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});