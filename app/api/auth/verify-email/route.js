import { prisma } from "@/lib/prisma"
import { hashToken } from "@/lib/tokens"

export async function POST(request) {
  try {
    const body = await request.json()

    const token = body.token?.trim()
    const invitationToken = body.invitationToken?.trim() || null

    if (!token) {
      return Response.json(
        {
          message: "Verification token is required.",
        },
        { status: 400 }
      )
    }

    const tokenHash = hashToken(token)

    const verificationToken =
      await prisma.emailVerificationToken.findUnique({
        where: {
          tokenHash,
        },
        include: {
          user: true,
        },
      })

    if (!verificationToken) {
      return Response.json(
        {
          message: "This verification link is invalid.",
        },
        { status: 400 }
      )
    }

    if (verificationToken.usedAt) {
      return Response.json(
        {
          message: "This verification link has already been used.",
        },
        { status: 400 }
      )
    }

    if (verificationToken.expiresAt <= new Date()) {
      return Response.json(
        {
          message: "This verification link has expired.",
        },
        { status: 400 }
      )
    }

    /*
     * Mark the email as verified and mark the token as used.
     */
    await prisma.$transaction(async (transaction) => {
      await transaction.user.update({
        where: {
          id: verificationToken.userId,
        },
        data: {
          emailVerified: new Date(),
        },
      })

      await transaction.emailVerificationToken.update({
        where: {
          id: verificationToken.id,
        },
        data: {
          usedAt: new Date(),
        },
      })
    })

    /*
     * If this verification came from an invitation,
     * make sure the invitation still belongs to this
     * user's email before passing the invitation onward.
     */
    let validInvitationToken = null

    if (invitationToken) {
      const invitationTokenHash = hashToken(invitationToken)

      const invitation =
        await prisma.organizationInvitation.findUnique({
          where: {
            tokenHash: invitationTokenHash,
          },
        })

      if (
        invitation &&
        !invitation.acceptedAt &&
        invitation.expiresAt > new Date() &&
        invitation.email.trim().toLowerCase() ===
          verificationToken.user.email.trim().toLowerCase()
      ) {
        validInvitationToken = invitationToken
      }
    }

    return Response.json({
      success: true,
      message:
        "Your email has been verified successfully. Redirecting you to login...",
      invitationToken: validInvitationToken,
    })
  } catch (error) {
    console.error("Email verification error:", error)

    return Response.json(
      {
        message: "Unable to verify your email.",
      },
      { status: 500 }
    )
  }
}