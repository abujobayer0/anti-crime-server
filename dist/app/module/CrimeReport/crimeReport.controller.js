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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrimeReportController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const crimeReport_service_1 = require("./crimeReport.service");
const AppError_1 = __importDefault(require("../../errors/AppError"));
class CrimeReportController {
}
exports.CrimeReportController = CrimeReportController;
_a = CrimeReportController;
CrimeReportController.getHealth = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Health check passed",
    });
}));
CrimeReportController.createCrimeReport = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const report = yield crimeReport_service_1.CrimeReportService.createCrimeReport(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Crime report created successfully",
        data: report,
    });
}));
CrimeReportController.queryCrimeReports = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query.searchTerm;
    const reports = yield crimeReport_service_1.CrimeReportService.queryCrimeReports(query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Crime reports fetched successfully",
        data: reports,
    });
}));
CrimeReportController.getUserReports = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
    if (!userId) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "User ID not found");
    }
    const reports = yield crimeReport_service_1.CrimeReportService.getUserReports(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "User reports fetched successfully",
        data: reports,
    });
}));
CrimeReportController.getProfileReports = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    if (!userId) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "User ID not found");
    }
    const reports = yield crimeReport_service_1.CrimeReportService.getProfileReports(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "User reports fetched successfully",
        data: reports,
    });
}));
CrimeReportController.getRecentReports = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const reports = yield crimeReport_service_1.CrimeReportService.getRecentReports();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Recent reports fetched successfully",
        data: reports,
    });
}));
CrimeReportController.getAllCrimeReports = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const reports = yield crimeReport_service_1.CrimeReportService.getAllCrimeReports();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Crime reports fetched successfully",
        data: reports,
    });
}));
CrimeReportController.getAllAlgorithmicReports = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const reports = yield crimeReport_service_1.CrimeReportService.getAllAlgorithmicReports();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Algorithmic Crime Reports reports fetched successfully",
        data: reports,
    });
}));
CrimeReportController.getCrimeReportById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const report = yield crimeReport_service_1.CrimeReportService.getCrimeReportById(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Crime report fetched successfully",
        data: report,
    });
}));
CrimeReportController.updateCrimeReport = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const updatedReport = yield crimeReport_service_1.CrimeReportService.updateCrimeReport(id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Crime report updated successfully",
        data: updatedReport,
    });
}));
CrimeReportController.deleteCrimeReport = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    yield crimeReport_service_1.CrimeReportService.deleteCrimeReport(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Crime report deleted successfully",
    });
}));
CrimeReportController.toggleUpvote = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const userId = req.user.id;
    const result = yield crimeReport_service_1.CrimeReportService.toggleUpvote(id, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Vote updated successfully",
        data: result,
    });
}));
CrimeReportController.toggleDownvote = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const userId = req.user.id;
    const result = yield crimeReport_service_1.CrimeReportService.toggleDownvote(id, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Vote updated successfully",
        data: result,
    });
}));
