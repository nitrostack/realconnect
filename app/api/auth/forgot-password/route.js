import { prisma } from "@/lib/prisma"
import { createSecureToken, hashToken } from "@/lib/tokens"
import { sendPasswordResetEmail } from "@/lib/email"

export async function POST(request) {
  try {
    const body = await request.json()
    const email = body.email?.trim().toLowerCase()

    if (!email) {
      return Response.json(
        {
          message: "Email address is required.",
        },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    })

    /*
     * Always return the same message whether the
     * account exists or not. This prevents exposing
     * which email addresses have RealConnect accounts.
     */
    const genericMessage =
      "If an account exists for this email, a password reset link has been sent."

    if (!user) {
      return Response.json({
        success: true,
        message: genericMessage,
      })
    }

    /*
     * Generate a secure random token and store only
     * its SHA-256 hash in the database.
     */
    const token = createSecureToken()
    const tokenHash = hashToken(token)

    /*
     * Reset links are valid for 1 hour.
     */
    const expiresAt = new Date(
      Date.now() + 60 * 60 * 1000
    )

    /*
     * Invalidate any previous unused reset tokens
     * for this account.
     */
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    })

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    })

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000"

    const resetUrl =
      `${appUrl}/reset-password?token=${encodeURIComponent(token)}`

    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl,
    })

    return Response.json({
      success: true,
      message: genericMessage,
    })
  } catch (error) {
    console.error(
      "Forgot password error:",
      error
    )

    return Response.json(
      {
        message:
          "Unable to process your password reset request.",
      },
      { status: 500 }
    )
  }
}