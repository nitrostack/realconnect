import { requireAuth } from "@/lib/auth-helpers"
// import CreateOrganizationForm from "@/components/CreateOrganizationForm"
import CreateOrganizationForm from "../../components/CreateOrganizationForm"

export default async function OrganizationsPage() {
  await requireAuth()

  return (
    <main>
      <h1>Organizations</h1>

      <p>
        Create an organization and build your real estate team.
      </p>
      
      <CreateOrganizationForm />
    </main>
  )
}