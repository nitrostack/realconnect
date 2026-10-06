import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await requireAuth()

    const memberships =
      await prisma.organizationMembership.findMany({
        where: {
          userId: Number(session.user.id),
        },

        include: {
          organization: true,
        },

        orderBy: {
          createdAt: "asc",
        },
      })

    return Response.json({
      success: true,
      organizations: memberships,
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    )
  }
}