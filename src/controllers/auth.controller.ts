import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signAdminToken } from "../utils/jwt";

export async function adminLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = signAdminToken({ id: admin.id, email: admin.email, role: admin.role });

    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
      token,
    });
  } catch (err) {
    next(err);
  }
}

export async function adminLogout(req: Request, res: Response) {
  res.clearCookie("admin_token");
  res.json({ success: true, message: "Logged out" });
}

export async function adminMe(req: Request, res: Response) {
  res.json({ success: true, data: req.admin });
}