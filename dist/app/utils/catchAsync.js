"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// If you want to see its use check the validateRequest.ts file inside the middleware folder.
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((err) => next(err));
    };
};
exports.default = catchAsync;
