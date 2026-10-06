"use client"

import Link from "next/link"
import { useState } from "react"

export default function ForgotPasswordPage() {
  const [email, setEmail] =
    useState("")

  const [message, setMessage] =
    useState("")

  const [loading, setLoading] =
    useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    setLoading(true)
    setMessage("")

    try {
      const response =
        await fetch(
          "/api/auth/forgot-password",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              email,
            }),
          }
        )
      const data =
        await response.json()
      
      if(!response.ok) {
        setMessage(
          data.message || 
          "Unable to process your request"
        )
        return
      }
        
      setMessage(
        data.message ||
          "If an account exists for this email, a password reset link has been sent."
      )
    } catch (error) {
      console.error(error)

      setMessage(
        "Something went wrong. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <h1>Forgot Password</h1>

      <p>
        Enter the email address associated
        with your RealConnect account.
      </p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Sending..."
            : "Send Reset Link"}
        </button>
      </form>

      {message && (
        <p>{message}</p>
      )}

      <p>
        <Link href="/login">
          Back to login
        </Link>
      </p>
    </main>
  )
}