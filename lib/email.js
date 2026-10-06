import { Resend } from "resend"

const resend = new Resend(
  process.env.RESEND_API_KEY
)

const fromEmail =
  process.env.EMAIL_FROM

if(!fromEmail) {
  throw new Error(
    "EMAIL_FROM is not configured"
  )
}

export async function sendEmailVerificationEmail({
  email,
  name,
  verificationUrl,
}) {
  const { data, error } =
    await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject:
        "Verify your RealConnect email",
      html: `
        <div>
          <h1>Welcome to RealConnect</h1>

          <p>
            Hello ${name || "there"},
          </p>

          <p>
            Please verify your email address
            to activate your RealConnect account.
          </p>

          <p>
            <a href="${verificationUrl}">
              Verify my email
            </a>
          </p>

          <p>
            This verification link will expire
            in 24 hours.
          </p>
        </div>
      `,
    })

  if (error) {
    console.error(
      "Email verification send error:",
      error
    )

    throw new Error(
      "Failed to send verification email"
    )
  }

  return data
}

export async function sendOrganizationInvitationEmail({
  email,
  name,
  organizationName,
  role,
  invitationUrl,
}) {
  const { data, error } =
    await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject:
        `You've been invited to join ${organizationName}`,
      html: `
        <div>
          <h1>
            You're invited to RealConnect
          </h1>

          <p>
            Hello ${name || "there"},
          </p>

          <p>
            You have been invited to join
            <strong>${organizationName}</strong>
            as a
            <strong>${role}</strong>.
          </p>

          <p>
            <a href="${invitationUrl}">
              View Invitation
            </a>
          </p>

          <p>
            This invitation will expire
            in 7 days.
          </p>
        </div>
      `,
    })

  if (error) {
    console.error(
      "Organization invitation send error:",
      error
    )

    throw new Error(
      "Failed to send organization invitation"
    )
  }

  return data
}


export async function sendPasswordResetEmail({
  email,
  name,
  resetUrl,
}) {
  console.log("Sending password reset email to:", email)

  const { data, error } =
    await resend.emails.send({
      from: fromEmail,

      to: [email],

      subject:
        "Reset your RealConnect password",

      html: `
        <div>
          <h1>Reset your RealConnect password</h1>

          <p>
            Hello ${name || "there"},
          </p>

          <p>
            We received a request to reset the
            password for your RealConnect account.
          </p>

          <p>
            <a href="${resetUrl}">
              Reset my password
            </a>
          </p>

          <p>
            This link will expire in 1 hour.
          </p>

          <p>
            If you did not request a password reset,
            you can safely ignore this email.
          </p>
        </div>
      `,
    })

  if (error) {
    console.error(
      "Password reset email error:",
      error
    )

    throw new Error(
      "Failed to send password reset email"
    )
  }

  return data
}
