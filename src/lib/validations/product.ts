import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, { error: "Name must be at least 2 characters" }).max(100, { error: "Name is too long" }),
  description: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
  flavor_ids: z.array(z.string().uuid()).optional(),
});

export const updateProductSchema = z.object({
  id: z.string().uuid({ error: "ID is required" }),
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
  flavor_ids: z.array(z.string().uuid()).optional(),
});
