import type { AddressInput } from "@ecommerce/shared";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";

export async function listAddresses(userId: string) {
  return prisma.address.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function createAddress(userId: string, input: AddressInput) {
  return prisma.$transaction(async (tx) => {
    if (input.isDefaultShipping) {
      await tx.address.updateMany({ where: { userId, isDefaultShipping: true }, data: { isDefaultShipping: false } });
    }
    if (input.isDefaultBilling) {
      await tx.address.updateMany({ where: { userId, isDefaultBilling: true }, data: { isDefaultBilling: false } });
    }

    const existingCount = await tx.address.count({ where: { userId } });

    return tx.address.create({
      data: {
        ...input,
        userId,
        // A user's very first address is sensibly their default for both.
        isDefaultShipping: input.isDefaultShipping ?? existingCount === 0,
        isDefaultBilling: input.isDefaultBilling ?? existingCount === 0,
      },
    });
  });
}

async function assertOwnedByUser(addressId: string, userId: string) {
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) {
    throw ApiError.notFound("Address not found");
  }
  return address;
}

export async function updateAddress(userId: string, addressId: string, input: Partial<AddressInput>) {
  await assertOwnedByUser(addressId, userId);

  return prisma.$transaction(async (tx) => {
    if (input.isDefaultShipping) {
      await tx.address.updateMany({ where: { userId, isDefaultShipping: true }, data: { isDefaultShipping: false } });
    }
    if (input.isDefaultBilling) {
      await tx.address.updateMany({ where: { userId, isDefaultBilling: true }, data: { isDefaultBilling: false } });
    }
    return tx.address.update({ where: { id: addressId }, data: input });
  });
}

export async function deleteAddress(userId: string, addressId: string) {
  await assertOwnedByUser(addressId, userId);
  await prisma.address.delete({ where: { id: addressId } });
}
