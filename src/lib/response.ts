import { Response } from "express";
import { ApiResponse } from "../types";

/**
 * Response builder utility to standardize API responses
 * Reduces duplication and ensures consistency
 */
export const sendResponse = <T = unknown>(
  res: Response,
  options: {
    success: boolean;
    statusCode: number;
    message: string;
    data?: T;
    error?: string;
  }
): void => {
  const { success, statusCode, message, data, error } = options;

  const response: ApiResponse<T> = {
    success,
    message,
    ...(data && { data }),
    ...(error && { error }),
  };

  res.status(statusCode).json(response);
};

/**
 * Convenience functions for common response types
 */
export const responses = {
  success: <T = unknown>(
    res: Response,
    message: string,
    data?: T,
    statusCode = 200
  ): void => sendResponse(res, { success: true, statusCode, message, data }),

  created: <T = unknown>(res: Response, message: string, data?: T): void =>
    sendResponse(res, { success: true, statusCode: 201, message, data }),

  badRequest: (res: Response, message: string, error?: string): void =>
    sendResponse(res, {
      success: false,
      statusCode: 400,
      message: message || "Bad request",
      error: error || message,
    }),

  unauthorized: (res: Response, message = "Authentication required"): void =>
    sendResponse(res, {
      success: false,
      statusCode: 401,
      message,
      error: message,
    }),

  forbidden: (res: Response, message = "Access denied"): void =>
    sendResponse(res, {
      success: false,
      statusCode: 403,
      message,
      error: message,
    }),

  notFound: (res: Response, message = "Resource not found"): void =>
    sendResponse(res, {
      success: false,
      statusCode: 404,
      message,
      error: message,
    }),

  validationError: (res: Response, error: string): void =>
    sendResponse(res, {
      success: false,
      statusCode: 422,
      message: "Validation failed",
      error,
    }),

  internalError: (res: Response, isDev = false, error?: Error): void =>
    sendResponse(res, {
      success: false,
      statusCode: 500,
      message: "Internal server error",
      error: isDev ? error?.message : "Something went wrong",
    }),
};
