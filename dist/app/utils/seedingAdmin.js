"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = void 0;
/* eslint-disable no-console */
const auth_model_1 = __importDefault(require("../module/Auth/auth.model"));
const auth_service_1 = require("../module/Auth/auth.service");
const auth_utils_1 = require("../module/Auth/auth.utils");
const seed = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //atfirst check if the admin exist of not
        const admin = yield auth_model_1.default.findOne({
            role: auth_utils_1.userRole.admin,
            email: "zubayer.munna.dev@gmail.com",
            isBanned: false,
        });
        if (!admin) {
            yield auth_service_1.AuthServices.registerUserIntoDB({
                name: "Abu Talha Md Jobayer",
                email: "zubayer.munna.dev@gmail.com",
                password: "Admin123",
                contact: "+8801717171717",
                role: auth_utils_1.userRole.admin || "admin",
                profileImage: "https://i.ibb.co.com/39pHJZ94/IMG-0870.jpg",
                isVerified: true,
            });
            console.log("Admin created successfully...");
        }
    }
    catch (error) {
        console.log("Error in seeding", error);
    }
});
exports.seed = seed;
