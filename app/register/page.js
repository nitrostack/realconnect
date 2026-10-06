"use client"

import { useSearchParams } from "next/navigation"
import { useState } from "react"

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const invitationToken = searchParams.get("invitation") || ""

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    setMessage("")
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          invitationToken: invitationToken || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Unable to create your account.")
        return
      }

      setMessage(
        data.message ||
          "Account created successfully. Please check your email to verify your account."
      )

      setName("")
      setEmail("")
      setPassword("")
    } catch (error) {
      console.error("Registration error:", error)
      setError("Something went wrong while creating your account.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <h1>Create your RealConnect account</h1>

      {invitationToken && (
        <p>
          You are creating an account from an organization invitation.
        </p>
      )}

      {message && (
        <p
          style={{
            padding: "10px",
            border: "1px solid green",
            marginBottom: "15px",
          }}
        >
          {message}
        </p>
      )}

      {error && (
        <p
          style={{
            padding: "10px",
            border: "1px solid red",
            marginBottom: "15px",
          }}
        >
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name</label>
          <br />
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>

        <br />

        <div>
          <label htmlFor="email">Email address</label>
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
            minLength={8}
          />
        </div>

        <br />

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </main>
  )
}