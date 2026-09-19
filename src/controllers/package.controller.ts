import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export async function listPackages(req: Request, res: Response, next: NextFunction) {
  try {
    const { category } = req.query;
    const packages = await prisma.package.findMany({
      where: {
        isActive: true,
        ...(category ? { category: { slug: String(category) } } : {}),
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: packages });
  } catch (err) {
    next(err);
  }
}

export async function getPackageBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = req.params.slug as string;
    const pkg = await prisma.package.findUnique({ where: { slug }, include: { category: true } });

    if (!pkg || !pkg.isActive) {
      return res.status(404).json({ success: false, message: "Package not found" });
    }
    res.json({ success: true, data: pkg });
  } catch (err) {
    next(err);
  }
}

export async function adminListPackages(req: Request, res: Response, next: NextFunction) {
  try {
    const packages = await prisma.package.findMany({ include: { category: true }, orderBy: { createdAt: "desc" } });
    res.json({ success: true, data: packages });
  } catch (err) {
    next(err);
  }
}

export async function adminCreatePackage(req: Request, res: Response, next: NextFunction) {
  try {
    const { categoryId, name, slug, price, description, items, imageUrl, isActive, facebookPostUrl } = req.body;
    const pkg = await prisma.package.create({
      data: {
        categoryId,
        name,
        slug,
        price,
        description,
        items: items || [],
        imageUrl,
        isActive: isActive ?? true,
        facebookPostUrl,
      },
    });
    res.status(201).json({ success: true, data: pkg });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdatePackage(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { categoryId, name, slug, price, description, items, imageUrl, isActive, facebookPostUrl } = req.body;
    const pkg = await prisma.package.update({
      where: { id },
      data: { categoryId, name, slug, price, description, items, imageUrl, isActive, facebookPostUrl },
    });
    res.json({ success: true, data: pkg });
  } catch (err) {
    next(err);
  }
}

export async function adminDeletePackage(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await prisma.package.delete({ where: { id } });
    res.json({ success: true, message: "Package deleted" });
  } catch (err) {
    next(err);
  }
}