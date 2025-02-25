import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { Types } from "mongoose";

export const createToken = (
  jwtPayload: {
    id: Types.ObjectId;
    email: string | undefined;
    role: string;
  },
  secret: Secret,
  expiresIn: string | number
) => {
  return jwt.sign(jwtPayload, secret, {
    expiresIn,
  } as SignOptions);
};

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret) as JwtPayload;
};
