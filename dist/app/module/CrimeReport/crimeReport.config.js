"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMENT_POPULATE_CONFIG = void 0;
exports.COMMENT_POPULATE_CONFIG = {
    path: "comments",
    populate: [
        {
            path: "userId",
            select: "name profileImage",
        },
        {
            path: "replyTo",
            populate: [
                {
                    path: "userId",
                    select: "name profileImage",
                },
                {
                    path: "replyTo",
                    populate: [
                        {
                            path: "userId",
                            select: "name profileImage",
                        },
                    ],
                },
            ],
        },
    ],
};
