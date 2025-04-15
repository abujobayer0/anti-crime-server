"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserValidation = exports.registerUserValidationSchema = void 0;
const zod_1 = require("zod");
exports.registerUserValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: "Name is required" }),
        contact: zod_1.z.string().optional(),
        email: zod_1.z
            .string()
            .email("Invalid email address")
            .nonempty("Email is required"),
        password: zod_1.z
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
const loginUserValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string()
            .email("Invalid email address")
            .nonempty("Email is required"),
        password: zod_1.z.string().min(6, "Password must be at least 6 characters long"),
    }),
});
exports.UserValidation = {
    registerUserValidationSchema: exports.registerUserValidationSchema,
    loginUserValidationSchema,
    // updateUserValidationSchema,
};
