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
exports.CrimeReportService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const crimeReport_model_1 = require("./crimeReport.model");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const queryBuilder_1 = __importDefault(require("../../builder/queryBuilder"));
const crimeReport_config_1 = require("./crimeReport.config");
const auth_model_1 = __importDefault(require("../Auth/auth.model"));
const notification_interface_1 = require("../Notification/notification.interface");
const notification_service_1 = __importDefault(require("../Notification/notification.service"));
const logger_1 = __importDefault(require("../../utils/logger"));
class CrimeReportService {
    static createCrimeReport(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (Array.isArray(data.crimeType)) {
                    data.crimeType = data.crimeType.join(", ");
                }
                return yield crimeReport_model_1.CrimeReport.create(data);
            }
            catch (error) {
                this.logger.error("Error creating crime report:", error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to create crime report");
            }
        });
    }
    /**
     * Get all non-deleted crime reports
     * @returns Promise resolving to an array of crime reports
     */
    static getAllCrimeReports() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const reports = yield crimeReport_model_1.CrimeReport.find({ isDeleted: false })
                    .populate("userId")
                    .populate(crimeReport_config_1.COMMENT_POPULATE_CONFIG)
                    .populate("upvotes")
                    .populate("downvotes")
                    .sort({ createdAt: -1 });
                if (!reports || reports.length === 0) {
                    throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Crime Reports not found");
                }
                return reports;
            }
            catch (error) {
                if (error instanceof AppError_1.default)
                    throw error;
                this.logger.error("Error fetching all crime reports:", error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to fetch crime reports");
            }
        });
    }
    /**
     * Get all algorithmically sorted reports
     * @returns Promise resolving to an array of algorithmically sorted crime reports
     */
    static getAllAlgorithmicReports() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.getAlgorithmicReports();
            }
            catch (error) {
                this.logger.error("Error fetching algorithmic reports:", error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to fetch algorithmic reports");
            }
        });
    }
    /**
     * Get crime report by ID
     * @param id - Crime report ID
     * @returns Promise resolving to the crime report or null
     */
    static getCrimeReportById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!id) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Report ID is required");
                }
                const report = yield crimeReport_model_1.CrimeReport.findById(id)
                    .populate("userId")
                    .populate(crimeReport_config_1.COMMENT_POPULATE_CONFIG)
                    .populate("upvotes")
                    .populate("downvotes")
                    .sort({ createdAt: -1 });
                if (!report)
                    throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Crime Report not found");
                return report;
            }
            catch (error) {
                if (error instanceof AppError_1.default)
                    throw error;
                this.logger.error(`Error fetching crime report with ID ${id}:`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to fetch crime report");
            }
        });
    }
    /**
     * Get reports by user ID
     * @param userId - User ID
     * @returns Promise resolving to an array of crime reports
     */
    static getUserReports(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!userId) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User ID is required");
                }
                const userReports = yield crimeReport_model_1.CrimeReport.find({ userId })
                    .populate("userId")
                    .sort({ createdAt: -1 });
                if (!userReports || userReports.length === 0) {
                    throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User reports not found");
                }
                return userReports;
            }
            catch (error) {
                if (error instanceof AppError_1.default)
                    throw error;
                this.logger.error(`Error fetching user reports for user ${userId}:`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to fetch user reports");
            }
        });
    }
    /**
     * Get profile reports by user ID string
     * @param userId - User ID as string
     * @returns Promise resolving to an array of crime reports
     */
    static getProfileReports(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!userId) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User ID is required");
                }
                const userReports = yield crimeReport_model_1.CrimeReport.find({ userId })
                    .populate("userId")
                    .sort({ createdAt: -1 });
                if (!userReports || userReports.length === 0) {
                    throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User reports not found");
                }
                return userReports;
            }
            catch (error) {
                if (error instanceof AppError_1.default)
                    throw error;
                this.logger.error(`Error fetching profile reports for user ${userId}:`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to fetch profile reports");
            }
        });
    }
    /**
     * Get reports created in the last 24 hours
     * @returns Promise resolving to an array of recent crime reports
     */
    static getRecentReports() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const recentReports = yield crimeReport_model_1.CrimeReport.find({
                    createdAt: { $gte: twentyFourHoursAgo },
                    isDeleted: false,
                })
                    .populate("userId")
                    .sort({ createdAt: -1 });
                return recentReports || [];
            }
            catch (error) {
                this.logger.error("Error fetching recent reports:", error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to fetch recent reports");
            }
        });
    }
    /**
     * Update crime report by ID
     * @param id - Crime report ID
     * @param updates - Crime report updates
     * @returns Promise resolving to the updated crime report or null
     */
    static updateCrimeReport(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!id) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Report ID is required");
                }
                const updatedReport = yield crimeReport_model_1.CrimeReport.findByIdAndUpdate(id, updates, {
                    new: true,
                    runValidators: true,
                });
                if (!updatedReport)
                    throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Crime Report not found");
                return updatedReport;
            }
            catch (error) {
                if (error instanceof AppError_1.default)
                    throw error;
                this.logger.error(`Error updating crime report with ID ${id}:`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to update crime report");
            }
        });
    }
    /**
     * Soft delete crime report by ID (mark as deleted)
     * @param id - Crime report ID
     * @returns Promise resolving when the report is marked as deleted
     */
    static deleteCrimeReport(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!id) {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Report ID is required");
                }
                const report = yield crimeReport_model_1.CrimeReport.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
                if (!report)
                    throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Crime Report not found");
            }
            catch (error) {
                if (error instanceof AppError_1.default)
                    throw error;
                this.logger.error(`Error deleting crime report with ID ${id}:`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to delete crime report");
            }
        });
    }
    /**
     * Search for crime reports and users based on query string
     * @param query - Search query string
     * @returns Promise resolving to an array of search results
     */
    static queryCrimeReports(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!query || typeof query !== "string") {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Valid query is required");
                }
                const crimeReportQuery = crimeReport_model_1.CrimeReport.find({ isDeleted: false })
                    .populate({
                    path: "userId",
                    select: "name email",
                })
                    .populate(crimeReport_config_1.COMMENT_POPULATE_CONFIG)
                    .populate("upvotes")
                    .populate("downvotes");
                const userQuery = auth_model_1.default.find({ isBanned: false }).select("-password");
                const crimeReportBuilder = new queryBuilder_1.default(crimeReportQuery, {
                    searchTerm: query,
                }).search(["title", "description", "division", "district"]);
                const userBuilder = new queryBuilder_1.default(userQuery, {
                    searchTerm: query,
                }).search(["name", "email"]);
                const [reports, users] = yield Promise.all([
                    crimeReportBuilder.modelQuery,
                    userBuilder.modelQuery,
                ]);
                const scoredReports = this.scoreReports(reports, query);
                const results = [
                    ...scoredReports.sort((a, b) => (b.algorithmScore || 0) - (a.algorithmScore || 0)),
                    ...users.map((user) => ({ type: "user", data: user })),
                ];
                return results;
            }
            catch (error) {
                if (error instanceof AppError_1.default)
                    throw error;
                this.logger.error(`Error querying crime reports with query "${query}":`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to query crime reports");
            }
        });
    }
    /**
     * Toggle upvote on a crime report
     * @param reportId - Crime report ID
     * @param userId - User ID
     * @returns Promise resolving to vote response
     */
    static toggleUpvote(reportId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.toggleVote(reportId, userId, "upvote");
            }
            catch (error) {
                if (error instanceof AppError_1.default)
                    throw error;
                this.logger.error(`Error toggling upvote on report ${reportId} by user ${userId}:`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to toggle upvote");
            }
        });
    }
    /**
     * Toggle downvote on a crime report
     * @param reportId - Crime report ID
     * @param userId - User ID
     * @returns Promise resolving to vote response
     */
    static toggleDownvote(reportId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.toggleVote(reportId, userId, "downvote");
            }
            catch (error) {
                if (error instanceof AppError_1.default)
                    throw error;
                this.logger.error(`Error toggling downvote on report ${reportId} by user ${userId}:`, error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to toggle downvote");
            }
        });
    }
    /**
     * Get algorithmically sorted reports
     * @returns Promise resolving to an array of algorithmically sorted crime reports
     */
    static getAlgorithmicReports() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const reports = yield crimeReport_model_1.CrimeReport.find({ isDeleted: false })
                    .populate("userId")
                    .populate(crimeReport_config_1.COMMENT_POPULATE_CONFIG)
                    .populate("upvotes")
                    .populate("downvotes");
                const scoredReports = reports.map((report) => {
                    const score = this.calculateReportScore(report);
                    return {
                        report,
                        score,
                    };
                });
                return scoredReports
                    .sort((a, b) => b.score - a.score)
                    .map((item) => (Object.assign(Object.assign({}, item.report.toObject()), { algorithmScore: item.score })));
            }
            catch (error) {
                this.logger.error("Error getting algorithmic reports:", error);
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to get algorithmic reports");
            }
        });
    }
    /**
     * Helper method to calculate report score for algorithmic sorting
     * @param report - Crime report
     * @returns Score value
     */
    static calculateReportScore(report) {
        var _a;
        let score = 0;
        const upvotes = report.upvotes.length;
        const downvotes = report.downvotes.length;
        const totalVotes = upvotes + downvotes;
        if (totalVotes > 0) {
            const z = 1.96;
            const p = upvotes / totalVotes;
            const denominator = totalVotes + z * z;
            const center = (p + (z * z) / (2 * totalVotes)) / denominator;
            const uncertainty = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * totalVotes)) / denominator);
            const voteScore = center - uncertainty;
            score += voteScore * 1000;
        }
        const hoursAge = (Date.now() - report.createdAt.getTime()) / (1000 * 60 * 60);
        const timeDecay = 1 / (1 + Math.log(hoursAge + 1));
        score *= timeDecay;
        const commentCount = ((_a = report.comments) === null || _a === void 0 ? void 0 : _a.length) || 0;
        const commentBonus = Math.log(commentCount + 1) * 100;
        score += commentBonus;
        if (upvotes > 0 && downvotes > 0) {
            const controversyBonus = Math.min(upvotes, downvotes) * 10;
            score += controversyBonus;
        }
        return Math.round(score * 100) / 100;
    }
    /**
     * Helper method to score reports for search results
     * @param reports - Array of crime reports
     * @param query - Search query string
     * @returns Array of scored search results
     */
    static scoreReports(reports, query) {
        return reports.map((report) => {
            var _a, _b, _c, _d;
            let score = this.calculateReportScore(report);
            const queryLower = query.toLowerCase();
            if ((_a = report.title) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(queryLower))
                score *= 1.5;
            if ((_b = report.description) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(queryLower))
                score *= 1.3;
            if ((_c = report.division) === null || _c === void 0 ? void 0 : _c.toLowerCase().includes(queryLower))
                score *= 1.2;
            if ((_d = report.district) === null || _d === void 0 ? void 0 : _d.toLowerCase().includes(queryLower))
                score *= 1.2;
            return {
                type: "report",
                data: report,
                algorithmScore: Math.round(score * 100) / 100,
            };
        });
    }
    /**
     * Toggle vote (upvote or downvote) on a crime report
     * @param reportId - Crime report ID
     * @param userId - User ID
     * @param voteType - Type of vote (upvote or downvote)
     * @returns Promise resolving to vote response
     */
    static toggleVote(reportId, userId, voteType) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!reportId || !userId) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Report ID and User ID are required");
            }
            const oppositeVoteType = voteType === "upvote" ? "downvotes" : "upvotes";
            const currentVoteType = voteType === "upvote" ? "upvotes" : "downvotes";
            const hasOppositeVote = yield crimeReport_model_1.CrimeReport.exists({
                _id: reportId,
                [oppositeVoteType]: userId,
            });
            if (hasOppositeVote) {
                yield crimeReport_model_1.CrimeReport.updateOne({ _id: reportId }, { $pull: { [oppositeVoteType]: userId } });
            }
            const hasCurrentVote = yield crimeReport_model_1.CrimeReport.exists({
                _id: reportId,
                [currentVoteType]: userId,
            });
            let report;
            let isAddingVote = false;
            if (hasCurrentVote) {
                report = yield crimeReport_model_1.CrimeReport.findOneAndUpdate({ _id: reportId }, { $pull: { [currentVoteType]: userId } }, { new: true }).populate("userId");
            }
            else {
                isAddingVote = true;
                report = yield crimeReport_model_1.CrimeReport.findOneAndUpdate({ _id: reportId }, { $addToSet: { [currentVoteType]: userId } }, { new: true }).populate("userId");
            }
            if (!report) {
                throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Crime report not found");
            }
            if (isAddingVote) {
                try {
                    const voter = yield auth_model_1.default.findById(userId);
                    if (report.userId._id.toString() !== userId) {
                        yield notification_service_1.default.createNotification({
                            recipient: report.userId._id.toString(),
                            sender: userId,
                            type: voteType === "upvote"
                                ? notification_interface_1.NotificationType.UPVOTE
                                : notification_interface_1.NotificationType.DOWNVOTE,
                            title: voteType === "upvote" ? "New Upvote" : "New Downvote",
                            message: `${(voter === null || voter === void 0 ? void 0 : voter.name) || "A user"} ${voteType}d your report: ${report.title}`,
                            relatedReport: reportId,
                        });
                    }
                }
                catch (error) {
                    this.logger.error(`Failed to create notification for ${voteType} on report ${reportId}:`, error);
                }
            }
            return {
                upvotes: report.upvotes.length,
                downvotes: report.downvotes.length,
                userVote: hasCurrentVote ? null : voteType,
            };
        });
    }
}
exports.CrimeReportService = CrimeReportService;
/**
 * Create a new crime report
 * @param data - Crime report data
 * @returns Promise resolving to the created crime report
 */
CrimeReportService.logger = new logger_1.default("CrimeReport");
