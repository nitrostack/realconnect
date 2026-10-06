import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user || !user.passwordHash) {
          return null
        }

        if(!user.emailVerified) {
          return null
        }

        const passwordIsValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!passwordIsValid) {
          return null
        }

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          platformRole: user.platformRole,
          marketplaceRoles: user.marketplaceRoles,
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.platformRole = user.platformRole
        token.marketplaceRoles = user.marketplaceRoles
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.platformRole = token.platformRole
        session.user.marketplaceRoles =
          token.marketplaceRoles
      }

      return session
    },
  },
})