import { requirePlatformAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export default async function AdminUsersPage() {
  const session = await requirePlatformAdmin()

  if (!session) {
    redirect("/dashboard")
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      platformRole: true,
      marketplaceRoles: true,

      memberships: {
        select: {
          role: true,

          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },

    orderBy: {
      id: "asc",
    },
  })

  return (
    <main>
      <h1>Manage Platform Users</h1>

      <p>
        Welcome,{" "}
        {session.user.name || "Platform Admin"}!
      </p>

      <hr />

      <h2>Users</h2>

      {users.map((user) => (
        <div key={user.id}>
          <h3>
            {user.name || "No name"}
          </h3>

          <p>
            Email: {user.email}
          </p>

          <p>
            Platform role:{" "}
            {user.platformRole}
          </p>

          <p>
            Marketplace roles:{" "}
            {user.marketplaceRoles.join(", ") ||
              "None"}
          </p>

          <h4>Organizations</h4>

          {user.memberships.length === 0 ? (
            <p>
              Not a member of any organization.
            </p>
          ) : (
            <ul>
              {user.memberships.map(
                (membership) => (
                  <li
                    key={
                      membership.organization.id
                    }
                  >
                    {membership.organization.name}
                    {" — "}
                    {membership.role}
                  </li>
                )
              )}
            </ul>
          )}

          <hr />
        </div>
      ))}
    </main>
  )
}