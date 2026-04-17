import { z } from "zod";
import { VALIDATION } from "./constants";

export const LoginSchema = z.object({
  username: z
    .string({ required_error: "Username is required" })
    .min(VALIDATION.USERNAME_MIN, `Username must be at least ${VALIDATION.USERNAME_MIN} characters`)
    .max(VALIDATION.USERNAME_MAX, `Username must not exceed ${VALIDATION.USERNAME_MAX} characters`)
    .trim(),
  password: z
    .string({ required_error: "Password is required" })
    .min(VALIDATION.PASSWORD_MIN, `Password must be at least ${VALIDATION.PASSWORD_MIN} characters`)
    .max(VALIDATION.PASSWORD_MAX, `Password must not exceed ${VALIDATION.PASSWORD_MAX} characters`),
});

export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Validate request body against a Zod schema
 * Returns { success, data, errors }
 */
export const validateBody = <T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; errors: z.ZodIssue[] } => {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error.issues };
};
