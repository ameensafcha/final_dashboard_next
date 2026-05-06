import { z } from "zod";

export const variantInventorySchema = z.object({
  variant_id: z.string({ required_error: "Variant ID is required" }).uuid(),
  quantity: z.preprocess(
    (val) => (typeof val === "string" ? parseInt(val) : val),
    z.number({ invalid_type_error: "Quantity must be a number" }).int("Quantity must be an integer")
  ),
  type: z.enum(["set", "add", "subtract"]).default("set"),
});
