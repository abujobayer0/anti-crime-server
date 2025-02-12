import { z } from "zod";

export const registerUserValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }),
    contract: z.string({ required_error: "Contact number is required" }),
    email: z
      .string()
      .email("Invalid email address")
      .nonempty("Email is required"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters long")
      .nonempty("Password is required")
      .optional(),
  }),
});

// export const updateUserValidationSchema = z.object({
//   body: z.object({
//     name: z.string().nonempty("Name is required").optional(),
//     email: z.string().email("Invalid email address").optional(),
//     password: z
//       .string()
//       .min(6, "Password must be at least 6 characters long")
//       .optional(),
//     image: z.string().optional(),
//     role: z.enum(["admin", "user"]).optional(),
//     status: z.enum([USER_STATUS.IN_PROGRESS, USER_STATUS.BLOCKED]).optional(),
//     flower: z.number().default(0).optional(),
//     flowing: z.number().default(0).optional(),
//     verified: z.boolean().optional(),
//     country: z.string().optional(),
//     address: z.string().optional(),
//     isDeleted: z.boolean().optional(),
//   }),
// });

const loginUserValidationSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Invalid email address")
      .nonempty("Email is required"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
  }),
});

export const UserValidation = {
  registerUserValidationSchema,
  loginUserValidationSchema,
  // updateUserValidationSchema,
};
