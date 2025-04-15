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
exports.AuthServices = void 0;
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../../../config"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const tokenGenerateFunction_1 = require("../../utils/tokenGenerateFunction");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_model_1 = __importDefault(require("./auth.model"));
const sendMail_1 = require("../../utils/sendMail");
const registerUserIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existingUser = yield auth_model_1.default.findOne({ email: payload.email });
    if (existingUser) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User already exists");
    }
    // Hash the password before storing it in the database
    const saltRounds = Number(config_1.default.bcrypt_slat_rounds) || 10;
    const hashedPassword = yield bcrypt_1.default.hash(payload.password, saltRounds);
    const newUser = yield auth_model_1.default.create(Object.assign(Object.assign({}, payload), { password: hashedPassword }));
    const jwtPayload = {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
    };
    // Generate JWT tokens
    const accessToken = (0, tokenGenerateFunction_1.createToken)(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expires_in);
    const refreshToken = (0, tokenGenerateFunction_1.createToken)(jwtPayload, config_1.default.jwt_refresh_secret, config_1.default.jwt_refresh_expires_in);
    const registerUser = yield auth_model_1.default.findOne({ email: newUser.email }).select("-password");
    return {
        result: registerUser,
        accessToken: accessToken,
        refreshToken: refreshToken,
    };
});
const loginUserFromDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.default.findOne({ email: payload.email });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    if (user === null || user === void 0 ? void 0 : user.isBanned) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "This user is banned!");
    }
    // Checking if the password is correct
    const isPasswordValid = yield bcrypt_1.default.compare(payload.password, user.password);
    if (!isPasswordValid) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Incorrect password");
    }
    const jwtPayload = {
        id: user._id,
        email: user.email,
        role: user.role,
    };
    const accessToken = (0, tokenGenerateFunction_1.createToken)(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expires_in);
    const refreshToken = (0, tokenGenerateFunction_1.createToken)(jwtPayload, config_1.default.jwt_refresh_secret, config_1.default.jwt_refresh_expires_in);
    const loginUser = yield auth_model_1.default.findOne({ email: user.email }).select("-password");
    return {
        result: loginUser,
        accessToken: accessToken,
        refreshToken: refreshToken,
    };
});
const resetLinkIntoDB = (_a) => __awaiter(void 0, [_a], void 0, function* ({ email }) {
    const user = yield auth_model_1.default.findOne({ email: email });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "This user is not found!");
    }
    if (user.isDeleted === true) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "This user is deleted!");
    }
    if (user.isBanned) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "This user is banned!");
    }
    const jwtPayload = {
        id: user._id,
        email: user.email,
        role: user.role,
    };
    const resetToken = (0, tokenGenerateFunction_1.createToken)(jwtPayload, config_1.default.jwt_access_secret, "10m");
    const resetLink = `${config_1.default.reset_link_url}?email=${user.email}&token=${resetToken}`;
    // Send email to the user with the reset link
    yield (0, sendMail_1.sendEmail)(user.email, resetLink, user);
});
const forgotPasswordIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.default.findOne({ email: payload === null || payload === void 0 ? void 0 : payload.email });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "This user is not found!");
    }
    if (user.isDeleted === true) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "This user is deleted!");
    }
    if (user.isBanned) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "This user is banned!");
    }
    // Check if token is valid
    const decoded = jsonwebtoken_1.default.verify(payload.token, config_1.default.jwt_access_secret);
    if (payload.email !== decoded.email) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "This user is forbidden!");
    }
    const newHashPassword = yield bcrypt_1.default.hash(payload.newPassword, Number(config_1.default.bcrypt_slat_rounds));
    const result = yield auth_model_1.default.findOneAndUpdate({ _id: decoded.id, role: decoded.role }, {
        password: newHashPassword,
    }, { new: true });
    return result;
});
const changePasswordIntoDB = (payload, email, token) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.default.findOne({ email: email });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "This user is not found!");
    }
    if (user.isDeleted) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "This user is deleted!");
    }
    if (user.isBanned) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "This user is blocked!");
    }
    const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt_access_secret);
    if (email !== decoded.email) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "This user is forbidden!");
    }
    const isCurrentPasswordCorrect = yield bcrypt_1.default.compare(payload.currentPassword, user.password);
    if (!isCurrentPasswordCorrect) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "Current password is incorrect!");
    }
    const newHashPassword = yield bcrypt_1.default.hash(payload.newPassword, Number(config_1.default.bcrypt_slat_rounds));
    const result = yield auth_model_1.default.findOneAndUpdate({ _id: decoded.id, role: decoded.role }, { password: newHashPassword }, { new: true });
    return result;
});
exports.AuthServices = {
    registerUserIntoDB,
    loginUserFromDB,
    resetLinkIntoDB,
    forgotPasswordIntoDB,
    changePasswordIntoDB,
};
