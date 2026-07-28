import { prisma } from "../../lib/prisma";

const LOW_STOCK_THRESHOLD = 5;
const REVENUE_SERIES_DAYS = 14;

interface RevenueRow {
  day: Date;
  revenue: string;
  orders: bigint;
}

export async function getDashboardStats() {
  const [totalRevenueResult, orderCountsByStatus, totalCustomers, lowStockVariants, recentOrders] = await Promise.all([
    prisma.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { grandTotal: true } }),
    prisma.order.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.user.count({ where: { role: "CUSTOMER", deletedAt: null } }),
    prisma.productVariant.findMany({
      where: { stock: { lte: LOW_STOCK_THRESHOLD } },
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { stock: "asc" },
      take: 10,
    }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { items: true } }),
  ]);

  // groupBy can't truncate a timestamp to a day, so this one query drops to
  // raw SQL - there's no user input interpolated, just a fixed interval.
  const revenueSeries = await prisma.$queryRaw<RevenueRow[]>`
    SELECT date_trunc('day', "createdAt") as day, COALESCE(SUM("grandTotal"), 0) as revenue, COUNT(*) as orders
    FROM "Order"
    WHERE "paymentStatus" = 'PAID' AND "createdAt" >= NOW() - make_interval(days => ${REVENUE_SERIES_DAYS}::int)
    GROUP BY day
    ORDER BY day ASC
  `;

  return {
    totalRevenue: Number(totalRevenueResult._sum.grandTotal ?? 0),
    orderCountsByStatus: Object.fromEntries(orderCountsByStatus.map((o) => [o.status, o._count.status])),
    totalCustomers,
    lowStockVariants: lowStockVariants.map((v) => ({
      variantId: v.id,
      sku: v.sku,
      stock: v.stock,
      productName: v.product.name,
      productSlug: v.product.slug,
    })),
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      grandTotal: Number(o.grandTotal),
      itemCount: o.items.length,
      createdAt: o.createdAt,
    })),
    revenueSeries: revenueSeries.map((r) => ({ day: r.day, revenue: Number(r.revenue), orders: Number(r.orders) })),
  };
}
