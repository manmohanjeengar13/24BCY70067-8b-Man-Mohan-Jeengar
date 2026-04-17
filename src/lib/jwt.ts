import jwt from "jsonwebtoken";
import { UserPayload } from "../types";
import { AUTH } from "./constants";
import { getConfig } from "./config";

const config = getConfig();
const JWT_SECRET = config.JWT_SECRET;
const JWT_EXPIRES_IN = config.JWT_EXPIRES_IN;

/**
 * Sign a JWT token with the user payload
 */
export const signToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: AUTH.JWT_ISSUER,
    audience: AUTH.JWT_AUDIENCE,
  } as jwt.SignOptions);
};

/**
 * Verify and decode a JWT token
 * Returns the decoded payload or throws an error
 */
export const verifyToken = (token: string): UserPayload => {
  const decoded = jwt.verify(token, JWT_SECRET, {
    issuer: AUTH.JWT_ISSUER,
    audience: AUTH.JWT_AUDIENCE,
  });

  return decoded as UserPayload;
};

/**
 * Decode a token without verifying (for inspection only)
 */
export const decodeToken = (token: string) => {
  return jwt.decode(token);
};
