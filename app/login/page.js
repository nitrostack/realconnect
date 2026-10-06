"use client"

import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const invitationToken = searchParams.get("invitation") || ""

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    setMessage("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setMessage("Invalid email or password")
        return
      }

      setMessage("Login successful!")

      /*
       * If the user came through an organization invitation,
       * send them back to that invitation after login.
       */
      if (invitationToken) {
        router.push(
          `/organizations/invitations/${encodeURIComponent(
            invitationToken
          )}`
        )
      } else {
        router.push("/dashboard")
      }

      router.refresh()
    } catch (error) {
      console.error("Login error:", error)
      setMessage("Something went wrong while logging in.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <h1>Login</h1>

      {invitationToken && (
        <p>
          Please log in with the email address that received the
          organization invitation.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <br />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <br />

        <div>
          <label htmlFor="password">Password</label>
          <br />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <br />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {message && <p>{message}</p>}
    </main>
  )
}