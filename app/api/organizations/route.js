import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function POST(request) {
  try {
    const session = await requireAuth()

    const body = await request.json()

    const name = body.name?.trim()
    const description = body.description?.trim() || null

    if (!name) {
      return Response.json(
        {
          success: false,
          message: "Organization name is required",
        },
        { status: 400 }
      )
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    if (!slug) {
      return Response.json(
        {
          success: false,
          message: "Invalid organization name",
        },
        { status: 400 }
      )
    }

    const existingOrganization =
      await prisma.organization.findUnique({
        where: {
          slug,
        },
      })

    if (existingOrganization) {
      return Response.json(
        {
          success: false,
          message: "An organization with this name already exists",
        },
        { status: 409 }
      )
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        slug,
        description,

        memberships: {
          create: {
            userId: Number(session.user.id),
            role: "ORGANIZATION_ADMIN",
          },
        },
      },

      include: {
        memberships: true,
      },
    })

    return Response.json(
      {
        success: true,
        message: "Organization created successfully",
        organization,
      },
      { status: 201 }
    )
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