import { requireOrganizationRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(request, { params }) {
  try {
    const { organizationId } = await params

    const result = await requireOrganizationRole(
      organizationId,
      ["ORGANIZATION_ADMIN", "AGENT"]
    )

    if (!result) {
      return Response.json(
        {
          success: false,
          message: "You do not have access to this organization",
        },
        { status: 403 }
      )
    }

    const members =
      await prisma.organizationMembership.findMany({
        where: {
          organizationId: Number(organizationId),
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              platformRole: true,
              marketplaceRoles: true,
            },
          },
        },

        orderBy: {
          createdAt: "asc",
        },
      })

    return Response.json({
      success: true,
      members,
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

export async function POST(request, { params }) {
  try {
    const { organizationId } = await params

    const result = await requireOrganizationRole(
      organizationId,
      "ORGANIZATION_ADMIN"
    )

    if (!result) {
      return Response.json(
        {
          success: false,
          message:
            "Only organization administrators can add members",
        },
        { status: 403 }
      )
    }

    const body = await request.json()

    const email = body.email?.trim().toLowerCase()
    const role = body.role

    if (!email) {
      return Response.json(
        {
          success: false,
          message: "Email is required",
        },
        { status: 400 }
      )
    }

    if (
      role !== "AGENT" &&
      role !== "ORGANIZATION_ADMIN"
    ) {
      return Response.json(
        {
          success: false,
          message: "Invalid organization role",
        },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (!user) {
      return Response.json(
        {
          success: false,
          message:
            "No user exists with that email address. Invitations will be added later.",
        },
        { status: 404 }
      )
    }

    const organizationIdNumber = Number(organizationId)

    const existingMembership =
      await prisma.organizationMembership.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: organizationIdNumber,
          },
        },
      })

    if (existingMembership) {
      return Response.json(
        {
          success: false,
          message:
            "This user is already a member of the organization",
        },
        { status: 409 }
      )
    }

    const membership =
      await prisma.organizationMembership.create({
        data: {
          userId: user.id,
          organizationId: organizationIdNumber,
          role,
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              platformRole: true,
              marketplaceRoles: true,
            },
          },

          organization: true,
        },
      })

    return Response.json(
      {
        success: true,
        message: "Member added successfully",
        membership,
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


export async function PATCH(request, { params }) {
  try {
    const { organizationId } = await params

    const result = await requireOrganizationRole(
      organizationId,
      "ORGANIZATION_ADMIN"
    )

    if (!result) {
      return Response.json(
        {
          success: false,
          message:
            "Only organization administrators can change member roles",
        },
        { status: 403 }
      )
    }

    const body = await request.json()

    const userId = Number(body.userId)
    const role = body.role

    if (!Number.isInteger(userId)) {
      return Response.json(
        {
          success: false,
          message: "Invalid user ID",
        },
        { status: 400 }
      )
    }

    if (
      role !== "AGENT" &&
      role !== "ORGANIZATION_ADMIN"
    ) {
      return Response.json(
        {
          success: false,
          message: "Invalid organization role",
        },
        { status: 400 }
      )
    }

    const organizationIdNumber = Number(organizationId)

    const membership =
      await prisma.organizationMembership.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: organizationIdNumber,
          },
        },
      })

    if (!membership) {
      return Response.json(
        {
          success: false,
          message: "Organization member not found",
        },
        { status: 404 }
      )
    }

    if (
      membership.role === "ORGANIZATION_ADMIN" &&
      role === "AGENT"
    ) {
      const adminCount =
        await prisma.organizationMembership.count({
          where: {
            organizationId: organizationIdNumber,
            role: "ORGANIZATION_ADMIN",
          },
        })

      if (adminCount <= 1) {
        return Response.json(
          {
            success: false,
            message:
              "The organization must always have at least one administrator",
          },
          { status: 400 }
        )
      }
    }

    const updatedMembership =
      await prisma.organizationMembership.update({
        where: {
          id: membership.id,
        },

        data: {
          role,
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
      })

    return Response.json({
      success: true,
      message: "Member role updated successfully",
      membership: updatedMembership,
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

export async function DELETE(request, { params }) {
  try {
    const { organizationId } = await params

    const result = await requireOrganizationRole(
      organizationId,
      "ORGANIZATION_ADMIN"
    )

    if (!result) {
      return Response.json(
        {
          success: false,
          message:
            "Only organization administrators can remove members",
        },
        { status: 403 }
      )
    }

    const body = await request.json()

    const userId = Number(body.userId)

    if (!Number.isInteger(userId)) {
      return Response.json(
        {
          success: false,
          message: "Invalid user ID",
        },
        { status: 400 }
      )
    }

    const organizationIdNumber = Number(organizationId)

    const membership =
      await prisma.organizationMembership.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: organizationIdNumber,
          },
        },
      })

    if (!membership) {
      return Response.json(
        {
          success: false,
          message: "Organization member not found",
        },
        { status: 404 }
      )
    }

    if (membership.role === "ORGANIZATION_ADMIN") {
      const adminCount =
        await prisma.organizationMembership.count({
          where: {
            organizationId: organizationIdNumber,
            role: "ORGANIZATION_ADMIN",
          },
        })

      if (adminCount <= 1) {
        return Response.json(
          {
            success: false,
            message:
              "The organization must always have at least one administrator",
          },
          { status: 400 }
        )
      }
    }

    await prisma.organizationMembership.delete({
      where: {
        id: membership.id,
      },
    })

    return Response.json({
      success: true,
      message: "Member removed successfully",
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