import type { Prisma } from "@ecommerce/db";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import type { CartIdentity, CartItemView, CartView } from "./cart.types";

const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            include: { images: { take: 1, orderBy: { position: "asc" } } },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.CartInclude;

type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

function assertIdentity(identity: CartIdentity) {
  if (!identity.userId && !identity.guestToken) {
    throw ApiError.badRequest("A guest cart token or an authenticated session is required");
  }
}

async function findCartRecord(identity: CartIdentity): Promise<CartWithItems | null> {
  if (identity.userId) {
    return prisma.cart.findUnique({ where: { userId: identity.userId }, include: cartInclude });
  }
  if (identity.guestToken) {
    return prisma.cart.findUnique({ where: { guestToken: identity.guestToken }, include: cartInclude });
  }
  return null;
}

async function getOrCreateCartRecord(identity: CartIdentity): Promise<CartWithItems> {
  assertIdentity(identity);
  const existing = await findCartRecord(identity);
  if (existing) return existing;

  return prisma.cart.create({
    data: { userId: identity.userId, guestToken: identity.userId ? undefined : identity.guestToken },
    include: cartInclude,
  });
}

/** Re-derives each line's live price/stock from the catalog and persists any drift, so a cart never silently overcharges or oversells. */
async function reconcileAndBuildView(cart: CartWithItems): Promise<CartView> {
  const items: CartItemView[] = [];
  const staleUpdates: Promise<unknown>[] = [];

  for (const item of cart.items) {
    const effectivePrice = Number(item.variant.priceOverride ?? item.variant.product.basePrice);
    const storedPrice = Number(item.priceSnapshot);
    const priceChanged = effectivePrice !== storedPrice;

    if (priceChanged) {
      staleUpdates.push(prisma.cartItem.update({ where: { id: item.id }, data: { priceSnapshot: effectivePrice } }));
    }

    items.push({
      id: item.id,
      variantId: item.variantId,
      productId: item.variant.productId,
      productName: item.variant.product.name,
      productSlug: item.variant.product.slug,
      image: item.variant.imageUrl ?? item.variant.product.images[0]?.url ?? null,
      sku: item.variant.sku,
      size: item.variant.size,
      color: item.variant.color,
      quantity: item.quantity,
      unitPrice: effectivePrice,
      lineTotal: Math.round(effectivePrice * item.quantity * 100) / 100,
      availableStock: item.variant.stock,
      priceChanged,
    });
  }

  if (staleUpdates.length) await Promise.all(staleUpdates);

  const subtotal = Math.round(items.reduce((sum, i) => sum + i.lineTotal, 0) * 100) / 100;
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return { id: cart.id, items, subtotal, itemCount };
}

export async function getCart(identity: CartIdentity): Promise<CartView> {
  const cart = await findCartRecord(identity);
  if (!cart) return { id: null, items: [], subtotal: 0, itemCount: 0 };
  return reconcileAndBuildView(cart);
}

export async function addItem(identity: CartIdentity, variantId: string, quantity: number): Promise<CartView> {
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId }, include: { product: true } });
  if (!variant || variant.product.deletedAt || !variant.product.isActive) {
    throw ApiError.notFound("Product variant not found");
  }

  const cart = await getOrCreateCartRecord(identity);
  const existingItem = cart.items.find((item) => item.variantId === variantId);
  const desiredQuantity = (existingItem?.quantity ?? 0) + quantity;

  if (desiredQuantity > variant.stock) {
    throw ApiError.conflict(`Only ${variant.stock} left in stock`);
  }

  const effectivePrice = Number(variant.priceOverride ?? variant.product.basePrice);

  if (existingItem) {
    await prisma.cartItem.update({ where: { id: existingItem.id }, data: { quantity: desiredQuantity, priceSnapshot: effectivePrice } });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, variantId, quantity, priceSnapshot: effectivePrice },
    });
  }

  return getCart(identity);
}

export async function updateItemQuantity(identity: CartIdentity, itemId: string, quantity: number): Promise<CartView> {
  const cart = await getOrCreateCartRecord(identity);
  const item = cart.items.find((i) => i.id === itemId);
  if (!item) throw ApiError.notFound("Cart item not found");

  if (quantity > item.variant.stock) {
    throw ApiError.conflict(`Only ${item.variant.stock} left in stock`);
  }

  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  return getCart(identity);
}

export async function removeItem(identity: CartIdentity, itemId: string): Promise<CartView> {
  const cart = await getOrCreateCartRecord(identity);
  const item = cart.items.find((i) => i.id === itemId);
  if (!item) throw ApiError.notFound("Cart item not found");

  await prisma.cartItem.delete({ where: { id: itemId } });
  return getCart(identity);
}

export async function clearCart(identity: CartIdentity): Promise<void> {
  const cart = await findCartRecord(identity);
  if (!cart) return;
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
}

/** Called right after login/register when the browser was holding a guest cart, so items survive the transition to an authenticated session. */
export async function mergeGuestCartIntoUser(userId: string, guestToken: string): Promise<CartView> {
  const guestCart = await prisma.cart.findUnique({ where: { guestToken }, include: cartInclude });
  if (!guestCart || guestCart.items.length === 0) return getCart({ userId });

  const userCart = await getOrCreateCartRecord({ userId });

  for (const guestItem of guestCart.items) {
    const existing = userCart.items.find((i) => i.variantId === guestItem.variantId);
    const combinedQuantity = Math.min((existing?.quantity ?? 0) + guestItem.quantity, guestItem.variant.stock);

    if (existing) {
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: combinedQuantity } });
    } else {
      await prisma.cartItem.create({
        data: { cartId: userCart.id, variantId: guestItem.variantId, quantity: combinedQuantity, priceSnapshot: guestItem.priceSnapshot },
      });
    }
  }

  await prisma.cart.delete({ where: { id: guestCart.id } });
  return getCart({ userId });
}
