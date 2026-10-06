import { prisma } from "@/lib/prisma"
import { hashToken } from "@/lib/tokens"
import { auth } from "@/auth"

export async function POST(request) {
  try {
    /*
     * Require the user to be logged in.
     */
    const session = await auth()

    if (!session?.user) {
      return Response.json(
        {
          message:
            "You must be logged in to accept an invitation.",
        },
        { status: 401 }
      )
    }

    /*
     * Read the invitation token.
     */
    const body = await request.json()

    const token =
      body.token?.trim()

    if (!token) {
      return Response.json(
        {
          message:
            "Invitation token is required.",
        },
        { status: 400 }
      )
    }

    /*
     * Hash the raw token.
     *
     * The database only stores the hash.
     */
    const tokenHash =
      hashToken(token)

    /*
     * Find the invitation.
     */
    const invitation =
      await prisma.organizationInvitation.findUnique({
        where: {
          tokenHash,
        },

        include: {
          organization: true,
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

    /*
     * Check whether the invitation
     * has already been accepted.
     */
    if (invitation.acceptedAt) {
      return Response.json(
        {
          message:
            "This invitation has already been accepted.",
        },
        { status: 400 }
      )
    }

    /*
     * Check whether the invitation
     * has expired.
     */
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

    /*
     * The email associated with the
     * authenticated account.
     */
    const authenticatedEmail =
      session.user.email
        ?.trim()
        .toLowerCase()

    const invitationEmail =
      invitation.email
        .trim()
        .toLowerCase()

    /*
     * Important security check:
     *
     * The person accepting the invitation
     * must be logged into the same email
     * address that received the invitation.
     */

    const userId = Number(session.user.id)

    if (
      !authenticatedEmail ||
      authenticatedEmail !== invitationEmail
    ) {
      return Response.json(
        {
          message:
            "This invitation was sent to a different email address.",
        },
        { status: 403 }
      )
    }

    const authenticatedUser = await prisma.user.findUnique({
  where: {
    id: userId,
  },
})

if (!authenticatedUser) {
  return Response.json(
    {
      message:
        "Your account could not be found. Please log out and create or log in to a valid account.",
    },
    { status: 401 }
  )
}
    /*
     * Convert the Auth.js user ID
     * into a number for Prisma.
     */
    // const userId =
    //   Number(session.user.id)

    if (
      !Number.isInteger(userId)
    ) {
      return Response.json(
        {
          message:
            "Invalid authenticated user.",
        },
        { status: 400 }
      )
    }

    /*
     * Make sure the user is not
     * already a member of this organization.
     */
    const existingMembership =
      await prisma.organizationMembership.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId:
              invitation.organizationId,
          },
        },
      })

    if (existingMembership) {
      /*
       * Mark the invitation as accepted
       * because the user is already a member.
       */
      await prisma.organizationInvitation.update({
        where: {
          id: invitation.id,
        },

        data: {
          acceptedAt: new Date(),
        },
      })

      return Response.json({
        success: true,

        message:
          "You are already a member of this organization.",

        organization: {
          id:
            invitation.organization.id,

          name:
            invitation.organization.name,
        },
      })
    }

    /*
     * Create the membership and mark
     * the invitation as accepted in
     * one database transaction.
     */
    const membership =
      await prisma.$transaction(
        async (transaction) => {
          const createdMembership =
            await transaction.organizationMembership.create({
              data: {
                userId,

                organizationId:
                  invitation.organizationId,

                role:
                  invitation.role,
              },
            })

          await transaction.organizationInvitation.update({
            where: {
              id: invitation.id,
            },

            data: {
              acceptedAt:
                new Date(),
            },
          })

          return createdMembership
        }
      )

    return Response.json(
      {
        success: true,

        message:
          "Invitation accepted successfully.",

        membership: {
          id: membership.id,
          organizationId:
            membership.organizationId,
          role: membership.role,
        },

        organization: {
          id:
            invitation.organization.id,

          name:
            invitation.organization.name,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      "Accept organization invitation error:",
      error
    )

    return Response.json(
      {
        message:
          "Unable to accept the invitation.",
      },
      { status: 500 }
    )
  }
}