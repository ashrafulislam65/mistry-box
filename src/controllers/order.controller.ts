import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { generateOrdersExcel } from "../utils/excelExport";
import { OrderStatus } from "../generated/prisma/client";

export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { packageId, packageTierId, customerName, phone, address, note, source } = req.body;

    if (!packageId || !packageTierId || !customerName || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: "packageId, packageTierId, customerName, phone and address are required",
      });
    }

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg || !pkg.isActive) {
      return res.status(404).json({ success: false, message: "Package not found or unavailable" });
    }

    const tier = await prisma.packageTier.findUnique({ where: { id: packageTierId } });
    if (!tier || tier.packageId !== packageId) {
      return res.status(404).json({ success: false, message: "Selected pack not found for this package" });
    }

    const subtotal = Number(tier.price);
    const deliveryCharge = Number(pkg.deliveryCharge);
    const totalPrice = subtotal + deliveryCharge;

    const order = await prisma.order.create({
      data: {
        packageId,
        packageTierId,
        tierLabel: tier.label,
        customerName,
        phone,
        address,
        quantity: tier.quantity,
        subtotal,
        deliveryCharge,
        totalPrice,
        note,
        source: source || "website",
      },
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

    let start: Date | undefined;
    let end: Date | undefined;
    if (from || to) {
      start = from ? new Date(String(from)) : new Date(0);
      end = to ? new Date(new Date(String(to)).setHours(23, 59, 59, 999)) : new Date();
      where.createdAt = { gte: start, lte: end };
    }

    const orders = await prisma.order.findMany({
      where,
      include: { package: { include: { category: true } } },
      orderBy: { createdAt: "asc" },
    });

    const buffer = await generateOrdersExcel(orders);
    const dateLabel = start && end ? `${start.toISOString().slice(0, 10)}_to_${end.toISOString().slice(0, 10)}` : "all";
    const filename = `orders_${dateLabel}.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/orders/stats — dashboard-এর জন্য summary statistics
export async function adminGetOrderStats(req: Request, res: Response, next: NextFunction) {
  try {
    const [totalOrders, revenueAgg, statusGroups] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalPrice: true } }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

        const byStatus: Record<string, number> = { PENDING: 0, ON_HOLD: 0, CONFIRMED: 0, DELIVERED: 0, CANCELLED: 0 };
    statusGroups.forEach((g) => {
      byStatus[g.status] = g._count._all;
    });

    // গত ৭ দিনের প্রবণতা (chart-এর জন্য)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentOrders = await prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, totalPrice: true },
    });

    const dayMap = new Map<string, { count: number; revenue: number }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      dayMap.set(d.toISOString().slice(0, 10), { count: 0, revenue: 0 });
    }
    recentOrders.forEach((o) => {
      const key = o.createdAt.toISOString().slice(0, 10);
      const entry = dayMap.get(key);
      if (entry) {
        entry.count += 1;
        entry.revenue += Number(o.totalPrice);
      }
    });

    const last7Days = Array.from(dayMap.entries()).map(([date, v]) => ({ date, ...v }));

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: Number(revenueAgg._sum.totalPrice || 0),
        byStatus,
        last7Days,
      },
    });
  } catch (err) {
    next(err);
  }
}