import { prisma } from "@/lib/prisma"
import { hashToken } from "@/lib/tokens"
import { auth } from "@/auth"
import Link from "next/link"
import AcceptInvitationButton from "@/components/AcceptInvitationButton"

export default async function InvitationPage({
  params,
}) {
  const { token } =
    await params

  const tokenHash =
    hashToken(token)

  const invitation =
    await prisma.organizationInvitation.findUnique(
      {
        where: {
          tokenHash,
        },

        include: {
          organization: true,
        },
      }
    )

  if (!invitation) {
    return (
      <main>
        <h1>
          Invitation Not Found
        </h1>

        <p>
          This invitation is invalid.
        </p>

        <Link href="/login">
          Go to Login
        </Link>
      </main>
    )
  }

  if (invitation.acceptedAt) {
    return (
      <main>
        <h1>
          Invitation Already Used
        </h1>

        <p>
          This invitation has already
          been accepted.
        </p>

        <Link href="/login">
          Go to Login
        </Link>
      </main>
    )
  }

  if (
    invitation.expiresAt <
    new Date()
  ) {
    return (
      <main>
        <h1>
          Invitation Expired
        </h1>

        <p>
          This invitation has expired.
        </p>

        <Link href="/login">
          Go to Login
        </Link>
      </main>
    )
  }

  const session =
    await auth()

  if (!session?.user) {
    return (
      <main>
        <h1>
          You're Invited
        </h1>

        <h2>
          {invitation.organization.name}
        </h2>

        <p>
          Email:{" "}
          {invitation.email}
        </p>

        <p>
          Organization role:{" "}
          {invitation.role}
        </p>

        <hr />

        <p>
          Log in or create an account
          using the invited email address.
        </p>

        <p>
          <Link
            href={`/login?invitation=${token}`}
          >
            Log in
          </Link>
        </p>

        <p>
          <Link
            href={`/register?invitation=${token}`}
          >
            Create an account
          </Link>
        </p>
      </main>
    )
  }

  if (
    session.user.email?.toLowerCase() !==
    invitation.email.toLowerCase()
  ) {
    return (
      <main>
        <h1>
          Different Account
        </h1>

        <p>
          This invitation was sent to:
        </p>

        <p>
          <strong>
            {invitation.email}
          </strong>
        </p>

        <p>
          You are currently logged in as:
        </p>

        <p>
          <strong>
            {session.user.email}
          </strong>
        </p>

        <p>
          Please log out and log in with
          the invited email address.
        </p>

        <Link href="/dashboard">
          Return to Dashboard
        </Link>
      </main>
    )
  }

  return (
    <main>
      <h1>
        You're Invited
      </h1>

      <h2>
        {invitation.organization.name}
      </h2>

      <p>
        Email:{" "}
        {invitation.email}
      </p>

      <p>
        Organization role:{" "}
        {invitation.role}
      </p>

      <hr />

      <p>
        You are logged in with the
        invited account.
      </p>

      <AcceptInvitationButton
        token={token}
      />
    </main>
  )
}