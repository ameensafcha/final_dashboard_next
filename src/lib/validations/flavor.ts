import { z } from "zod";

export const flavorSchema = z.object({
  name: z.string().min(2, { error: "Name must be at least 2 characters" }),
  short_code: z.string()
    .min(2, { error: "Code must be at least 2 characters" })
    .max(3, { error: "Code cannot exceed 3 characters" })
    .transform(val => val.toUpperCase()),
  ingredients: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export const updateFlavorSchema = z.object({
  id: z.string().uuid({ error: "ID is required" }),
  name: z.string().min(2).optional(),
  short_code: z.string().min(2).max(3).optional().transform(val => val?.toUpperCase()),
  ingredients: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});