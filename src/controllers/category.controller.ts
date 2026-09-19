import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export async function listCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        packages: {
          where: { isActive: true },
          orderBy: { price: "asc" },
        },
      },
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

export async function adminListCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await prisma.category.findMany({ orderBy: { createdAt: "asc" } });
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

export async function adminCreateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, slug, description } = req.body;
    const category = await prisma.category.create({ data: { name, slug, description } });
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { name, slug, description } = req.body;
    const category = await prisma.category.update({ where: { id }, data: { name, slug, description } });
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    next(err);
  }
}