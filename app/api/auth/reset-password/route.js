import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { hashToken } from "@/lib/tokens"

export async function POST(request) {
  try {
    const body = await request.json()

    const token =
      body.token?.trim()

    const password =
      body.password

    if (!token || !password) {
      return Response.json(
        {
          message:
            "Token and password are required.",
        },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return Response.json(
        {
          message:
            "Password must be at least 8 characters.",
        },
        { status: 400 }
      )
    }

    const tokenHash =
      hashToken(token)

    const resetToken =
      await prisma.passwordResetToken.findUnique({
        where: {
          tokenHash,
        },
      })

    if (!resetToken) {
      return Response.json(
        {
          message:
            "Invalid or expired reset link.",
        },
        { status: 400 }
      )
    }

    if (resetToken.usedAt) {
      return Response.json(
        {
          message:
            "This reset link has already been used.",
        },
        { status: 400 }
      )
    }

    if (
      resetToken.expiresAt <
      new Date()
    ) {
      return Response.json(
        {
          message:
            "This reset link has expired.",
        },
        { status: 400 }
      )
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        12
      )

    await prisma.$transaction(
      async (transaction) => {
        await transaction.user.update({
          where: {
            id: resetToken.userId,
          },
          data: {
            passwordHash,
          },
        })

        await transaction.passwordResetToken.update({
          where: {
            id: resetToken.id,
          },
          data: {
            usedAt: new Date(),
          },
        })

        /*
         * Invalidate any other reset tokens
         * belonging to this account.
         */
        await transaction.passwordResetToken.updateMany({
          where: {
            userId: resetToken.userId,
            id: {
              not: resetToken.id,
            },
            usedAt: null,
          },
          data: {
            usedAt: new Date(),
          },
        })
      }
    )

    return Response.json({
      success: true,
      message:
        "Password reset successfully.",
    })
  } catch (error) {
    console.error(
      "Reset password error:",
      error
    )

    return Response.json(
      {
        message:
          "Unable to reset password.",
      },
      { status: 500 }
    )
  }
}