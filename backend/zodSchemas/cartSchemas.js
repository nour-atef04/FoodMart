import { z } from "zod";

export const cartItemSchema = z.object({
  body: z.object({
    product_id: z.number().int().positive("Product ID must be valid"),
    // .coerce forces strings like "5" into integers before route sees it
    item_quantity: z.coerce
      .number()
      .int()
      .min(1, "Item quantity must be at least 1"),
  }),
});
