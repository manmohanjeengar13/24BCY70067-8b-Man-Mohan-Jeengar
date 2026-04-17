import { Request } from "express";

export interface User {
  id: number;
  username: string;
  password: string;
  role: "admin" | "user";
}

export interface UserPayload {
  id: number;
  username: string;
  role: "admin" | "user";
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: UserPayload;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
