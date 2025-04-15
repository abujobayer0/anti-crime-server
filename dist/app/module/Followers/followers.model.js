"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Followers = void 0;
const mongoose_1 = require("mongoose");
const followersSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        unique: true,
        ref: "User",
    },
    following: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    followers: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
}, {
    timestamps: true,
});
exports.Followers = (0, mongoose_1.model)("Followers", followersSchema);
