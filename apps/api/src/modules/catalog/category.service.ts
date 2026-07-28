import type { CreateCategoryInput, UpdateCategoryInput } from "@ecommerce/shared";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { cacheGet, cacheSet, cacheDeleteByPrefix } from "../../lib/redis";
import { recordAudit } from "../../utils/audit";

const CACHE_PREFIX = "categories:";
const CACHE_TTL_SECONDS = 300;

export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  children: CategoryTreeNode[];
}

/** Public: active categories as a two-level tree (top-level -> subcategories), for nav/filter UI. */
export async function getCategoryTree(): Promise<CategoryTreeNode[]> {
  const cacheKey = `${CACHE_PREFIX}tree`;
  const cached = await cacheGet<CategoryTreeNode[]>(cacheKey);
  if (cached) return cached;

  const categories = await prisma.category.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { name: "asc" },
  });

  const byParent = new Map<string | null, typeof categories>();
  for (const category of categories) {
    const key = category.parentId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(category);
  }

  const buildNode = (id: string, name: string, slug: string, imageUrl: string | null): CategoryTreeNode => ({
    id,
    name,
    slug,
    imageUrl,
    children: (byParent.get(id) ?? []).map((c) => buildNode(c.id, c.name, c.slug, c.imageUrl)),
  });

  const roots = (byParent.get(null) ?? []).map((c) => buildNode(c.id, c.name, c.slug, c.imageUrl));
  await cacheSet(cacheKey, roots, CACHE_TTL_SECONDS);
  return roots;
}

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findFirst({
    where: { slug, deletedAt: null },
    include: { parent: true, children: { where: { deletedAt: null } } },
  });
  if (!category) throw ApiError.notFound("Category not found");
  return category;
}

/** Resolves a category slug to itself + all descendant ids, so browsing a parent shows subcategory products too. */
export async function resolveCategoryIdsBySlug(slug: string): Promise<string[]> {
  const category = await prisma.category.findFirst({ where: { slug, deletedAt: null } });
  if (!category) return [];
  const children = await prisma.category.findMany({ where: { parentId: category.id, deletedAt: null } });
  return [category.id, ...children.map((c) => c.id)];
}

export async function listCategoriesAdmin() {
  return prisma.category.findMany({ where: { deletedAt: null }, orderBy: [{ parentId: "asc" }, { name: "asc" }] });
}

export async function createCategory(input: CreateCategoryInput, actorUserId: string) {
  const category = await prisma.category.create({ data: input });
  await cacheDeleteByPrefix(CACHE_PREFIX);
  await recordAudit({ actorUserId, action: "category.create", entityType: "Category", entityId: category.id, metadata: { name: category.name } });
  return category;
}

export async function updateCategory(id: string, input: UpdateCategoryInput, actorUserId: string) {
  const category = await prisma.category.update({ where: { id }, data: input });
  await cacheDeleteByPrefix(CACHE_PREFIX);
  await recordAudit({ actorUserId, action: "category.update", entityType: "Category", entityId: id, metadata: { fields: Object.keys(input) } });
  return category;
}

export async function softDeleteCategory(id: string, actorUserId: string) {
  const productCount = await prisma.product.count({ where: { categoryId: id, deletedAt: null } });
  if (productCount > 0) {
    throw ApiError.conflict("Cannot delete a category that still has products. Reassign or remove them first.");
  }
  await prisma.category.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  await cacheDeleteByPrefix(CACHE_PREFIX);
  await recordAudit({ actorUserId, action: "category.delete", entityType: "Category", entityId: id });
}
