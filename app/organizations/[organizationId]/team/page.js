import { prisma } from "@/lib/prisma"
import { requireOrganizationRole } from "@/lib/auth-helpers"
import TeamManager from "@/components/TeamManager"
import { redirect } from "next/navigation"

export default async function TeamPage({
  params,
}) {
  const { organizationId } = await params

  const organizationIdNumber =
    Number(organizationId)

  if (
    !Number.isInteger(
      organizationIdNumber
    )
  ) {
    redirect("/dashboard")
  }

  const result =
    await requireOrganizationRole(
      organizationIdNumber,
      [
        "ORGANIZATION_ADMIN",
        "AGENT",
      ]
    )

  if (!result) {
    redirect("/dashboard")
  }

  /*
   * Load current organization members.
   */
  const members =
    await prisma.organizationMembership.findMany({
      where: {
        organizationId:
          organizationIdNumber,
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },

      orderBy: {
        createdAt: "asc",
      },
    })

  /*
   * Load active pending invitations.
   *
   * We only want invitations that:
   *
   * 1. Have not been accepted.
   * 2. Have not expired.
   */
  const invitations =
    await prisma.organizationInvitation.findMany({
      where: {
        organizationId:
          organizationIdNumber,

        acceptedAt: null,

        expiresAt: {
          gt: new Date(),
        },
      },

      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        acceptedAt: true,
        createdAt: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    })

  return (
    <main>
      <h1>{result.organization.name}</h1>

      <p>
        Manage your organization team
        members and invitations.
      </p>

      <TeamManager
        organizationId={
          organizationIdNumber
        }
        currentUserId={Number(
          result.session.user.id
        )}
        currentUserRole={
          result.membership.role
        }
        initialMembers={members}
        initialInvitations={
          invitations
        }
      />
    </main>
  )
}