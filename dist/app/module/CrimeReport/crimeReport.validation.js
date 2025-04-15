"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crimeReportValidation = void 0;
const zod_1 = require("zod");
exports.crimeReportValidation = zod_1.z.object({
    userId: zod_1.z.string(),
    title: zod_1.z.string().min(5),
    description: zod_1.z.string().min(10),
    images: zod_1.z.array(zod_1.z.string()).optional(),
    video: zod_1.z.string().optional(),
    division: zod_1.z.string(),
    district: zod_1.z.string(),
    postTime: zod_1.z.date(),
    crimeTime: zod_1.z.date(),
    upvotes: zod_1.z.array(zod_1.z.string()).optional(),
    downvotes: zod_1.z.array(zod_1.z.string()).optional(),
    comments: zod_1.z.array(zod_1.z.string()).optional(),
    isDeleted: zod_1.z.boolean().default(false),
    districtCoordinates: zod_1.z.array(zod_1.z.number()),
    divisionCoordinates: zod_1.z.array(zod_1.z.number()),
});
