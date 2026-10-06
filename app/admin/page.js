import { requirePlatformAdmin } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const session = await requirePlatformAdmin()

  if (!session) {
    redirect("/dashboard")
  }

  return (
    <main>
      <h1>Platform Admin Dashboard</h1>

      <p>
        Welcome, {session.user.name || "Admin"}!
      </p>

      <p>
        You have administrator access to the RealConnect platform.
      </p>
    </main>
  )
}