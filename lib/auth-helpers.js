import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export async function requireAuth() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return session
}

export async function requirePlatformAdmin() {
  const session = await requireAuth()

  if (session.user.platformRole !== "PLATFORM_ADMIN") {
    return null
  }

  return session
}

export async function requireMarketplaceRole(roles) {
  const session = await requireAuth()

  const allowedRoles = Array.isArray(roles)
    ? roles
    : [roles]

  const userRoles = session.user.marketplaceRoles || []

  const hasRole = allowedRoles.some((role) =>
    userRoles.includes(role)
  )

  if (!hasRole) {
    return null
  }

  return session
}

export async function requireOrganizationRole(
  organizationId,
  roles
) {
  const session = await requireAuth()

  const allowedRoles = Array.isArray(roles)
    ? roles
    : [roles]

  const userId = Number(session.user.id)

  const membership =
    await prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: Number(organizationId),
        },
      },
      include: {
        organization: true,
      },
    })

  if (!membership) {
    return null
  }

  if (!allowedRoles.includes(membership.role)) {
    return null
  }

  return {
    session,
    membership,
    organization: membership.organization,
  }
}