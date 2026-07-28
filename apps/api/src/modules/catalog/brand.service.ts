import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { recordAudit } from "../../utils/audit";

export async function listBrands() {
  return prisma.brand.findMany({ orderBy: { name: "asc" } });
}

export async function createBrand(name: string, slug: string, actorUserId: string) {
  const brand = await prisma.brand.create({ data: { name, slug } });
  await recordAudit({ actorUserId, action: "brand.create", entityType: "Brand", entityId: brand.id, metadata: { name } });
  return brand;
}

export async function deleteBrand(id: string, actorUserId: string) {
  const productCount = await prisma.product.count({ where: { brandId: id, deletedAt: null } });
  if (productCount > 0) {
    throw ApiError.conflict("Cannot delete a brand that still has products.");
  }
  await prisma.brand.delete({ where: { id } });
  await recordAudit({ actorUserId, action: "brand.delete", entityType: "Brand", entityId: id });
}
