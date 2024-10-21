import { NextFunction, Request, RequestHandler, Response } from 'express';

// If you want to see its use check the validateRequest.ts file inside the middleware folder.
const catchAsync = (fn: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};

export default catchAsync;
