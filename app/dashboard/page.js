import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import LogoutButton from "@/components/LogoutButton"

export default async function DashboardPage() {
  const session = await requireAuth()

  const userId = Number(session.user.id)

  if (!Number.isInteger(userId)) {
    throw new Error("Authenticated user ID is missing or invalid")
  }

  const memberships =
    await prisma.organizationMembership.findMany({
      where: {
        userId,
      },

      include: {
        organization: true,
      },

      orderBy: {
        createdAt: "asc",
      },
    })

  return (
    <main>
      <h1>Dashboard</h1>

      <p>
        Welcome, {session.user.name || "User"}!
      </p>

      <p>
        Email: {session.user.email}
      </p>

      <p>
        Platform role: {session.user.platformRole}
      </p>

      <p>
        Marketplace roles:{" "}
        {session.user.marketplaceRoles?.join(", ") ||
          "None"}
      </p>

      <hr />

      <h2>Your Organizations</h2>

      {memberships.length === 0 ? (
        <div>
          <p>
            You are not a member of any organization yet.
          </p>

          <Link href="/organizations">
            Create an organization
          </Link>
        </div>
      ) : (
        <div>
          {memberships.map((membership) => (
            <div key={membership.id}>
              <h3>
                {membership.organization.name}
              </h3>

              <p>
                Role: {membership.role}
              </p>

              <Link
                href={`/organizations/${membership.organization.id}`}
              >
                Open organization
              </Link>

              <hr />
            </div>
          ))}
        </div>
      )}

      <LogoutButton />
    </main>
  )
}