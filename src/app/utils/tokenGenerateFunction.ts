import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { Types } from "mongoose";

export const createToken = (
  jwtPayload: {
    id: Types.ObjectId;
    email: string | undefined;
    role: string;
  },
  secret: Secret,
  expiresIn: string
) => {
  return jwt.sign(jwtPayload, secret, {
    expiresIn,
  });
};

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret) as JwtPayload;
};
