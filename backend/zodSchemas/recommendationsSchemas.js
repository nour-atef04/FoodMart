import {z} from "zod";

export const cartRecommendationsSchema = z.object({
  body: z.object({
    // ensures cartItems is an array, defaults to an empty array if missing
    cartItems: z
      .array(
        z.object({
          product_id: z.coerce.number().int().positive(),
        }),
      )
      .catch([]),
  }),
});

export const productRecommendationsSchema = z.object({
  params: z.object({
    productId: z.coerce.number().int().positive("Invalid Product ID"),
  }),
});