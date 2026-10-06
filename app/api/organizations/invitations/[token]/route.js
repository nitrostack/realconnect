import { prisma } from "@/lib/prisma"
import { hashToken } from "@/lib/tokens"

export async function GET(
  request,
  { params }
) {
  try {
    const { token } = await params

    if (!token) {
      return Response.json(
        {
          message:
            "Invitation token is required.",
        },
        { status: 400 }
      )
    }

    const tokenHash =
      hashToken(token)

    const invitation =
      await prisma.organizationInvitation.findUnique({
        where: {
          tokenHash,
        },

        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      })

    if (!invitation) {
      return Response.json(
        {
          message:
            "This invitation is invalid or no longer exists.",
        },
        { status: 404 }
      )
    }

    if (invitation.acceptedAt) {
      return Response.json(
        {
          message:
            "This invitation has already been accepted.",
        },
        { status: 400 }
      )
    }

    if (
      invitation.expiresAt <=
      new Date()
    ) {
      return Response.json(
        {
          message:
            "This invitation has expired.",
        },
        { status: 400 }
      )
    }

    return Response.json({
      invitation: {
        id: invitation.id,

        email:
          invitation.email,

        role:
          invitation.role,

        expiresAt:
          invitation.expiresAt,

        createdAt:
          invitation.createdAt,

        organization:
          invitation.organization,
      },
    })
  } catch (error) {
    console.error(
      "Get invitation error:",
      error
    )

    return Response.json(
      {
        message:
          "Unable to load invitation.",
      },
      { status: 500 }
    )
  }
}