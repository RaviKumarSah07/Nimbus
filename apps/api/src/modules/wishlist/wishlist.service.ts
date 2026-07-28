import { prisma } from "../../lib/prisma";

export async function listWishlist(userId: string) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: { images: { take: 1, orderBy: { position: "asc" } }, category: true, brand: true, variants: true },
      },
    },
  });

  return items.map(({ product, createdAt }) => {
    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.basePrice),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      currency: product.currency,
      isFeatured: product.isFeatured,
      avgRating: Number(product.avgRating),
      ratingCount: product.ratingCount,
      category: product.category ? { id: product.category.id, name: product.category.name, slug: product.category.slug } : null,
      brand: product.brand ? { id: product.brand.id, name: product.brand.name, slug: product.brand.slug } : null,
      image: product.images[0] ? { url: product.images[0].url, altText: product.images[0].altText } : null,
      inStock: totalStock > 0,
      wishlistedAt: createdAt,
    };
  });
}

export async function listWishlistedProductIds(userId: string): Promise<string[]> {
  const items = await prisma.wishlistItem.findMany({ where: { userId }, select: { productId: true } });
  return items.map((i) => i.productId);
}

/** Idempotent by design - a heart-toggle button shouldn't error on a double-click/duplicate add. */
export async function addToWishlist(userId: string, productId: string) {
  return prisma.wishlistItem.upsert({
    where: { userId_productId: { userId, productId } },
    update: {},
    create: { userId, productId },
  });
}

export async function removeFromWishlist(userId: string, productId: string) {
  await prisma.wishlistItem.deleteMany({ where: { userId, productId } });
}
