import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { generateOrdersExcel } from "../utils/excelExport";
import { OrderStatus } from "../generated/prisma/client";

export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { packageId, customerName, phone, address, quantity, note, source } = req.body;

    if (!packageId || !customerName || !phone || !address) {
      return res.status(400).json({ success: false, message: "packageId, customerName, phone and address are required" });
    }

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg || !pkg.isActive) {
      return res.status(404).json({ success: false, message: "Package not found or unavailable" });
    }

    const qty = Number(quantity) > 0 ? Number(quantity) : 1;
    const totalPrice = Number(pkg.price) * qty;

    const order = await prisma.order.create({
      data: { packageId, customerName, phone, address, quantity: qty, totalPrice, note, source: source || "website" },
    });

    res.status(201).json({ success: true, data: order, message: "Order placed successfully" });
  } catch (err) {
    next(err);
  }
}

export async function adminListOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, from, to } = req.query;
    const where: any = {};
    if (status) where.status = status as OrderStatus;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(String(from));
      if (to) where.createdAt.lte = new Date(String(to));
    }

    const orders = await prisma.order.findMany({
      where,
      include: { package: { include: { category: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateOrderStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!Object.values(OrderStatus).includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const order = await prisma.order.update({ where: { id }, data: { status } });
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function adminExportOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to, status } = req.query;
    const where: any = {};
    if (status) where.status = status as OrderStatus;

    const start = from ? new Date(String(from)) : new Date(new Date().setHours(0, 0, 0, 0));
    const end = to ? new Date(String(to)) : new Date(new Date().setHours(23, 59, 59, 999));
    where.createdAt = { gte: start, lte: end };

    const orders = await prisma.order.findMany({
      where,
      include: { package: { include: { category: true } } },
      orderBy: { createdAt: "asc" },
    });

    const buffer = await generateOrdersExcel(orders);
    const filename = `orders_${start.toISOString().slice(0, 10)}_to_${end.toISOString().slice(0, 10)}.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}