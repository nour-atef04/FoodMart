import {z} from "zod"

export const getProductsSchema = z.object({
  query: z.object({
    search: z.string().optional().default(""),
    category: z.string().optional().default(""),
    // coerce strings to numbers + ensure they are >= 1 + and default to 1 or 10 if missing
    // if invalid type -> won't throw validation error, instead .catch(1) will force variable to 1
    page: z.coerce.number().int().min(1).catch(1),
    limit: z.coerce.number().int().min(1).max(100).catch(10),
  }),
});

export const productIdParamSchema = z.object({
  params: z.object({
    product_id: z.coerce.number().int().positive("Invalid product ID"),
  }),
});

export const productMutationSchema = z.object({
  body: z.object({
    product_name: z.string().min(1, "Product name is required"),
    product_description: z.string().min(1, "Description is required"),
    product_category: z.string().min(1, "Category is required"),
    product_img: z.string().min(1, "Image URL is required"),
    product_price: z.coerce
      .number()
      .positive("Price must be a positive number"),
    stock_quantity: z.coerce
      .number()
      .int()
      .min(0, "Stock cannot be negative")
      .default(0),
  }),
});