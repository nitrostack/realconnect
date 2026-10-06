import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { createSecureToken, hashToken } from "@/lib/tokens"
import { sendEmailVerificationEmail } from "@/lib/email"

export async function POST(request) {
  try {
    const body = await request.json()

    const name = body.name?.trim()
    const email = body.email?.trim().toLowerCase()
    const password = body.password
    const invitationToken = body.invitationToken?.trim() || null

    if (!email || !password) {
      return Response.json(
        {
          message: "Email and password are required.",
        },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return Response.json(
        {
          message: "Password must be at least 8 characters long.",
        },
        { status: 400 }
      )
    }

    /*
     * If the user arrived through an organization invitation,
     * validate the invitation before creating the account.
     */
    let invitation = null

    if (invitationToken) {
      const invitationTokenHash = hashToken(invitationToken)

      invitation = await prisma.organizationInvitation.findUnique({
        where: {
          tokenHash: invitationTokenHash,
        },
        include: {
          organization: true,
        },
      })

      if (!invitation) {
        return Response.json(
          {
            message: "This organization invitation is invalid.",
          },
          { status: 400 }
        )
      }

      if (invitation.acceptedAt) {
        return Response.json(
          {
            message: "This organization invitation has already been accepted.",
          },
          { status: 400 }
        )
      }

      if (invitation.expiresAt <= new Date()) {
        return Response.json(
          {
            message: "This organization invitation has expired.",
          },
          { status: 400 }
        )
      }

      /*
       * The account email MUST match the email
       * the organization invited.
       */
      if (email !== invitation.email.trim().toLowerCase()) {
        return Response.json(
          {
            message:
              "The email address must match the email address that received the organization invitation.",
          },
          { status: 400 }
        )
      }
    }

    /*
     * Prevent duplicate accounts.
     */
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (existingUser) {
      return Response.json(
        {
          message:
            "An account with this email address already exists. Please log in instead.",
        },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const verificationToken = createSecureToken()
    const verificationTokenHash = hashToken(verificationToken)

    const verificationExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    )

    /*
     * Create the user and email verification token together.
     */
    const user = await prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: {
          name: name || null,
          email,
          passwordHash,
          role: "BUYER",
          platformRole: "USER",
          marketplaceRoles: ["BUYER"],
        },
      })

      await transaction.emailVerificationToken.create({
        data: {
          userId: createdUser.id,
          tokenHash: verificationTokenHash,
          expiresAt: verificationExpiresAt,
        },
      })

      return createdUser
    })

    /*
     * Preserve the invitation token in the verification URL.
     */
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    let verificationUrl =
      `${appUrl}/verify-email?token=${encodeURIComponent(
        verificationToken
      )}`

    if (invitationToken) {
      verificationUrl +=
       `&invitation=${encodeURIComponent(invitationToken)}`
    }

    /*
     * If email sending fails, remove the newly-created
     * user and verification token so we don't leave
     * a broken account behind.
     */
    try {
      await sendEmailVerificationEmail({
        email: user.email,
        name: user.name,
        verificationUrl,
      })
    } catch (error) {
      console.error("Registration verification email error:", error)

      await prisma.user.delete({
        where: {
          id: user.id,
        },
      })

      return Response.json(
        {
          message:
            "Your account could not be created because the verification email could not be sent. Please try again.",
        },
        { status: 500 }
      )
    }

    return Response.json(
      {
        success: true,
        message:
          "Account created successfully. Please check your email to verify your account.",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)

    return Response.json(
      {
        message: "Unable to create your account.",
      },
      { status: 500 }
    )
  }
}