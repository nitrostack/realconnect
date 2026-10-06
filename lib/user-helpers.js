import { prisma } from "@/lib/prisma"

export async function addMarketplaceRole(
  userId,
  role
) {
  const user = await prisma.user.findUnique({
    where: {
      id: Number(userId),
    },
  })

  if (!user) {
    throw new Error("User not found")
  }

  if (user.marketplaceRoles.includes(role)) {
    return user
  }

  return prisma.user.update({
    where: {
      id: Number(userId),
    },

    data: {
      marketplaceRoles: {
        push: role,
      },
    },
  })
}

export async function removeMarketplaceRole(
  userId,
  role
) {
  const user = await prisma.user.findUnique({
    where: {
      id: Number(userId),
    },
  })

  if (!user) {
    throw new Error("User not found")
  }

  const updatedRoles =
    user.marketplaceRoles.filter(
      (currentRole) => currentRole !== role
    )

  return prisma.user.update({
    where: {
      id: Number(userId),
    },

    data: {
      marketplaceRoles: updatedRoles,
    },
  })
}

export async function updatePlatformRole(
  userId,
  platformRole
) {
  return prisma.user.update({
    where: {
      id: Number(userId),
    },

    data: {
      platformRole,
    },
  })
}