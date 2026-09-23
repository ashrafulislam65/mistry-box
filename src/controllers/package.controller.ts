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
      include: { category: true, tiers: { orderBy: { sortOrder: "asc" } } },
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
    const pkg = await prisma.package.findUnique({
      where: { slug },
      include: { category: true, tiers: { orderBy: { sortOrder: "asc" } } },
    });

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
    const packages = await prisma.package.findMany({
      include: { category: true, tiers: { orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: packages });
  } catch (err) {
    next(err);
  }
}

interface TierInput {
  label: string;
  quantity: number;
  price: number;
}

export async function adminCreatePackage(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      categoryId,
      name,
      slug,
      price,
      deliveryCharge,
      description,
      items,
      imageUrl,
      isActive,
      facebookPostUrl,
      tiers,
    } = req.body as any;

    const pkg = await prisma.package.create({
      data: {
        categoryId,
        name,
        slug,
        price,
        deliveryCharge: deliveryCharge ?? 99,
        description,
        items: items || [],
        imageUrl,
        isActive: isActive ?? true,
        facebookPostUrl,
        tiers: {
          create: ((tiers || []) as TierInput[]).map((t, i) => ({
            label: t.label,
            quantity: Number(t.quantity),
            price: Number(t.price),
            sortOrder: i,
          })),
        },
      },
      include: { tiers: true },
    });
    res.status(201).json({ success: true, data: pkg });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdatePackage(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const {
      categoryId,
      name,
      slug,
      price,
      deliveryCharge,
      description,
      items,
      imageUrl,
      isActive,
      facebookPostUrl,
      tiers,
    } = req.body as any;

    // tier গুলো পুরোপুরি replace করা হচ্ছে — সহজ, predictable admin UX-এর জন্য।
    // Neon pooled connection interactive transaction ($transaction) ভালোভাবে
    // সাপোর্ট করে না, তাই আলাদা আলাদা query হিসেবে চালানো হচ্ছে।
    await prisma.packageTier.deleteMany({ where: { packageId: id } });

    const pkg = await prisma.package.update({
      where: { id },
      data: {
        categoryId,
        name,
        slug,
        price,
        deliveryCharge,
        description,
        items,
        imageUrl,
        isActive,
        facebookPostUrl,
        tiers: {
          create: ((tiers || []) as TierInput[]).map((t, i) => ({
            label: t.label,
            quantity: Number(t.quantity),
            price: Number(t.price),
            sortOrder: i,
          })),
        },
      },
      include: { tiers: true },
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