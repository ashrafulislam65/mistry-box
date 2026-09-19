import { Request, Response, NextFunction } from "express";
import { verifyAdminToken } from "../utils/jwt";

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const tokenFromCookie = req.cookies?.admin_token;
    const token = tokenFromCookie || (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);

    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const payload = verifyAdminToken(token);
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}