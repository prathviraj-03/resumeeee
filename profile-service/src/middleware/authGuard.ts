import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("Missing required environment variable: JWT_SECRET");
}

export function authGuard(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header("Authorization") || req.header("authorization");
  const xUserId = req.header("x-user-id") || req.header("X-User-Id");

  // Bypass JWT check if X-User-Id is provided (internal service call or trusted gateway)
  if (xUserId) {
    req.user = { userId: xUserId };
    return next();
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid Authorization header" });
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");
  console.log("authGuard: token received", token ? "<token>" : "<empty>");

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as { userId?: string; id?: string; exp?: number };
    console.log("authGuard: token decoded", decoded);

    const userId = decoded.userId || decoded.id;

    if (!decoded || typeof decoded !== "object" || !userId) {
      console.error("authGuard: invalid token payload", { decoded });
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.user = { userId };
    console.log("authGuard: authenticated userId", userId);
    return next();
  } catch (error) {
    console.error("authGuard: token verify error", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
