import type { CreateBannerInput, UpdateBannerInput } from "@ecommerce/shared";
import { prisma } from "../../lib/prisma";
import { recordAudit } from "../../utils/audit";

export async function listActiveBanners() {
  const now = new Date();
  return prisma.banner.findMany({
    where: {
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: { position: "asc" },
  });
}

export async function listBannersAdmin() {
  return prisma.banner.findMany({ orderBy: { position: "asc" } });
}

export async function createBanner(input: CreateBannerInput, actorUserId: string) {
  const banner = await prisma.banner.create({ data: input });
  await recordAudit({ actorUserId, action: "banner.create", entityType: "Banner", entityId: banner.id, metadata: { title: banner.title } });
  return banner;
}

export async function updateBanner(id: string, input: UpdateBannerInput, actorUserId: string) {
  const banner = await prisma.banner.update({ where: { id }, data: input });
  await recordAudit({ actorUserId, action: "banner.update", entityType: "Banner", entityId: id, metadata: { fields: Object.keys(input) } });
  return banner;
}

export async function deleteBanner(id: string, actorUserId: string) {
  await prisma.banner.delete({ where: { id } });
  await recordAudit({ actorUserId, action: "banner.delete", entityType: "Banner", entityId: id });
}
