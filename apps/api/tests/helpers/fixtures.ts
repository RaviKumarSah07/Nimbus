import { prisma } from "../../src/lib/prisma";
import { Role } from "@ecommerce/db";
import bcrypt from "bcryptjs";

export async function createTestProduct(overrides: { basePrice?: number; stock?: number } = {}) {
  const category = await prisma.category.create({
    data: { name: "Test Category", slug: `test-category-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
  });

  const product = await prisma.product.create({
    data: {
      name: "Test Product",
      slug: `test-product-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      description: "A product used only in automated tests.",
      categoryId: category.id,
      basePrice: overrides.basePrice ?? 50,
      variants: {
        create: [{ sku: `TEST-SKU-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, stock: overrides.stock ?? 10 }],
      },
    },
    include: { variants: true },
  });

  return { category, product, variant: product.variants[0] };
}

export async function createTestUser(overrides: { role?: Role; email?: string } = {}) {
  const email = overrides.email ?? `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const passwordHash = await bcrypt.hash("Passw0rd!", 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, name: "Test User", role: overrides.role ?? Role.CUSTOMER },
  });
  return { user, password: "Passw0rd!" };
}
