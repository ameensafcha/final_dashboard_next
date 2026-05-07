import { z } from "zod";

export const variantInventorySchema = z.object({
  variant_id: z.string().uuid({ error: "Variant ID is required" }),
  quantity: z.preprocess(
    (val) => (typeof val === "string" ? parseInt(val) : val),
    z.number({ error: "Quantity must be a number" }).int({ error: "Quantity must be an integer" })
  ),
  type: z.enum(["set", "add", "subtract"]).default("set"),
});
