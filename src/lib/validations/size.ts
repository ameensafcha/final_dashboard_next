import { z } from "zod";

export const sizeSchema = z.object({
  size: z.preprocess(
    (val) => (typeof val === "number" ? val.toString() : val),
    z.string({ required_error: "Size is required" }).min(1)
  ),
  unit: z.string({ required_error: "Unit is required" }).min(1),
  pack_type: z.string({ required_error: "Pack type is required" }).min(2),
  is_active: z.boolean().optional().default(true),
});

export const updateSizeSchema = z.object({
  id: z.string({ required_error: "ID is required" }).uuid(),
  size: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  pack_type: z.string().min(2).optional(),
  is_active: z.boolean().optional(),
});
