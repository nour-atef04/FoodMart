import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    // normalize email (convert to lowercase and remove spaces) since UNIQUE in postgresql is case-sensitive
    email: z
      .string()
      .email("Invalid email format")
      .transform((val) => val.toLowerCase().trim()),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters long")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d).+$/,
        "Password must contain at least one letter and one number",
      ),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Invalid email format")
      .transform((val) => val.toLowerCase().trim()),
    password: z.string().min(1, "Password is required"),
    role: z.string().optional(),
  })
});
