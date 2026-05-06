import { z } from "zod";

export const productSchema = z.object({
  name: z.string({ required_error: "Name is required" }).min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  description: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
  flavor_ids: z.array(z.string().uuid()).optional(),
});

export const updateProductSchema = z.object({
  id: z.string({ required_error: "ID is required" }).uuid(),
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
  flavor_ids: z.array(z.string().uuid()).optional(),
});
