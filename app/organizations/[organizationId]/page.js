import { requireOrganizationRole } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function OrganizationPage({
  params,
}) {
  const resolvedParams = await params

  const organizationId = Number(
    resolvedParams.organizationId
  )

  if (!Number.isInteger(organizationId)) {
    redirect("/dashboard")
  }

  const result = await requireOrganizationRole(
    organizationId,
    ["ORGANIZATION_ADMIN", "AGENT"]
  )

  if (!result) {
    redirect("/dashboard")
  }

  const {
    session,
    membership,
    organization,
  } = result

  return (
    <main>
      <p>
        <Link href="/dashboard">
          ← Back to dashboard
        </Link>
      </p>

      <h1>{organization.name}</h1>

      <p>
        Welcome, {session.user.name || "User"}!
      </p>

      <p>
        Your organization role: {membership.role}
      </p>

      {organization.description && (
        <p>{organization.description}</p>
      )}

      <hr />

      <h2>Organization Dashboard</h2>

      <p>
        This is your workspace for{" "}
        {organization.name}.
      </p>

      <nav>
        <ul>
          <li>
            <Link
              href={`/organizations/${organization.id}/team`}
            >
              Team Management
            </Link>
          </li>

          <li>
            <Link
              href={`/organizations/${organization.id}`}
            >
              Organization Overview
            </Link>
          </li>
        </ul>
      </nav>

      {membership.role === "ORGANIZATION_ADMIN" && (
        <section>
          <h3>Administrator</h3>

          <p>
            You can manage the organization's team.
          </p>
        </section>
      )}

      {membership.role === "AGENT" && (
        <section>
          <h3>Agent Workspace</h3>

          <p>
            You can work with properties and clients
            assigned to the organization.
          </p>
        </section>
      )}
    </main>
  )
}