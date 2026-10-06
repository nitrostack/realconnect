import { prisma } from "@/lib/prisma"
import { requireOrganizationRole } from "@/lib/auth-helpers"
import { createSecureToken, hashToken } from "@/lib/tokens"
import { sendOrganizationInvitationEmail } from "@/lib/email"

export async function GET(request, { params }) {
  try {
    const { organizationId } = await params
    const organizationIdNumber = Number(organizationId)

    if (!Number.isInteger(organizationIdNumber)) {
      return Response.json(
        { message: "Invalid organization ID." },
        { status: 400 }
      )
    }

    const result = await requireOrganizationRole(
      organizationIdNumber,
      ["ORGANIZATION_ADMIN"]
    )

    if (!result) {
      return Response.json(
        { message: "You are not authorized to manage invitations." },
        { status: 403 }
      )
    }

    const invitations =
      await prisma.organizationInvitation.findMany({
        where: {
          organizationId: organizationIdNumber,
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

    return Response.json({
      success: true,
      invitations,
    })
  } catch (error) {
    console.error("Get organization invitations error:", error)

    return Response.json(
      {
        message: "Unable to load organization invitations.",
      },
      { status: 500 }
    )
  }
}

export async function POST(request, { params }) {
  try {
    const { organizationId } = await params
    const organizationIdNumber = Number(organizationId)

    if (!Number.isInteger(organizationIdNumber)) {
      return Response.json(
        { message: "Invalid organization ID." },
        { status: 400 }
      )
    }

    /*
     * Only organization admins can send invitations.
     */
    const result = await requireOrganizationRole(
      organizationIdNumber,
      ["ORGANIZATION_ADMIN"]
    )

    if (!result) {
      return Response.json(
        {
          message:
            "Only organization administrators can send invitations.",
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
          message: "Email address is required.",
        },
        { status: 400 }
      )
    }

    /*
     * Basic email validation.
     */
    const emailIsValid =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    if (!emailIsValid) {
      return Response.json(
        {
          message: "Please enter a valid email address.",
        },
        { status: 400 }
      )
    }

    /*
     * Only these organization roles can be assigned
     * through an invitation.
     */
    if (
      role !== "AGENT" &&
      role !== "ORGANIZATION_ADMIN"
    ) {
      return Response.json(
        {
          message: "Invalid organization role.",
        },
        { status: 400 }
      )
    }

    /*
     * Make sure the organization still exists.
     */
    const organization = await prisma.organization.findUnique({
      where: {
        id: organizationIdNumber,
      },
    })

    if (!organization) {
      return Response.json(
        {
          message: "Organization not found.",
        },
        { status: 404 }
      )
    }

    /*
     * Check whether this email already belongs
     * to a user.
     */
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    })

    /*
     * If the user already exists, check whether they
     * are already a member of this organization.
     */
    if (existingUser) {
      const existingMembership =
        await prisma.organizationMembership.findUnique({
          where: {
            userId_organizationId: {
              userId: existingUser.id,
              organizationId: organizationIdNumber,
            },
          },
        })

      if (existingMembership) {
        return Response.json(
          {
            message:
              "This user is already a member of the organization.",
          },
          { status: 409 }
        )
      }
    }

    /*
     * Don't allow multiple active invitations
     * for the same email in the same organization.
     */
    const existingInvitation =
      await prisma.organizationInvitation.findFirst({
        where: {
          organizationId: organizationIdNumber,
          email,
          acceptedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
      })

    if (existingInvitation) {
      return Response.json(
        {
          message:
            "There is already a pending invitation for this email address.",
        },
        { status: 409 }
      )
    }

    /*
     * Generate the raw invitation token.
     *
     * We send the raw token in the email,
     * but only store its hash in PostgreSQL.
     */
    const invitationToken = createSecureToken()
    const tokenHash = hashToken(invitationToken)

    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    )

    const invitation =
      await prisma.organizationInvitation.create({
        data: {
          organizationId: organizationIdNumber,
          email,
          role,
          tokenHash,
          expiresAt,
        },
      })

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000"

    const invitationUrl =
      `${appUrl}/organizations/invitations/${invitationToken}`

    /*
     * Send the invitation email.
     */
    try {
      await sendOrganizationInvitationEmail({
        email,
        name: existingUser?.name || null,
        organizationName: organization.name,
        role,
        invitationUrl,
      })
    } catch (error) {
      console.error(
        "Organization invitation email error:",
        error
      )

      /*
       * If the email could not be sent, remove the
       * invitation we just created.
       */
      await prisma.organizationInvitation.delete({
        where: {
          id: invitation.id,
        },
      })

      return Response.json(
        {
          message:
            "The invitation could not be sent because the email service failed.",
        },
        { status: 500 }
      )
    }

    return Response.json(
      {
        success: true,
        message: "Invitation sent successfully.",
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(
      "Create organization invitation error:",
      error
    )

    return Response.json(
      {
        message: "Unable to create organization invitation.",
      },
      { status: 500 }
    )
  }
}