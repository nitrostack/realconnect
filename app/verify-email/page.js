"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()

  const token = searchParams.get("token")
  const invitationToken = searchParams.get("invitation")

  const [message, setMessage] = useState("Verifying your email...")
  const [error, setError] = useState("")

  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setError("Email verification token is missing.")
        setMessage("")
        return
      }

      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            invitationToken: invitationToken || null,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.message || "Unable to verify your email.")
          setMessage("")
          return
        }

        setMessage(
          data.message || "Your email has been verified successfully."
        )

        /*
         * Give the user a moment to see the success message,
         * then continue to login.
         */
        setTimeout(() => {
          if (data.invitationToken) {
            window.location.href =
              `/login?invitation=${encodeURIComponent(
                data.invitationToken
              )}`
          } else {
            window.location.href = "/login"
          }
        }, 1500)
      } catch (error) {
        console.error("Email verification error:", error)
        setError("Something went wrong while verifying your email.")
        setMessage("")
      }
    }

    verifyEmail()
  }, [token, invitationToken])

  return (
    <main>
      <h1>Email Verification</h1>

      {message && <p>{message}</p>}

      {error && (
        <p
          style={{
            padding: "10px",
            border: "1px solid red",
            marginTop: "15px",
          }}
        >
          {error}
        </p>
      )}
    </main>
  )
}