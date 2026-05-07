import { z } from "zod";

export const sizeSchema = z.object({
  size: z.preprocess(
    (val) => (typeof val === "number" ? val.toString() : val),
    z.string().min(1, { error: "Size is required" })
  ),
  unit: z.string().min(1, { error: "Unit is required" }),
  pack_type: z.string().min(2, { error: "Pack type is required" }),
  is_active: z.boolean().optional().default(true),
});

export const updateSizeSchema = z.object({
  id: z.string().uuid({ error: "ID is required" }),
  size: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  pack_type: z.string().min(2).optional(),
  is_active: z.boolean().optional(),
});
