import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("Must be a valid URL"),
  NEXT_PUBLIC_APP_URL: z.string().url("Must be a valid URL").optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});
