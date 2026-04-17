import { Request, Response, NextFunction } from "express";
import { responses } from "../lib/response";

export const notFoundHandler = (req: Request, res: Response) => {
  responses.notFound(
    res,
    `Cannot ${req.method} ${req.path}`
  );
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("[Error]", err.stack);

  const isDev = process.env.NODE_ENV === "development";
  responses.internalError(res, isDev, err);
};
