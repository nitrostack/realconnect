"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

export default function ResetPasswordPage() {
  const searchParams =
    useSearchParams()

  const token =
    searchParams.get("token")

  const [password, setPassword] =
    useState("")

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("")

  const [message, setMessage] =
    useState("")

  const [success, setSuccess] =
    useState(false)

  const [loading, setLoading] =
    useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    setMessage("")
    setSuccess(false)

    if (!token) {
      setMessage(
        "This reset link is invalid."
      )
      return
    }

    if (
      password !==
      confirmPassword
    ) {
      setMessage(
        "Passwords do not match."
      )
      return
    }

    if (password.length < 8) {
      setMessage(
        "Password must be at least 8 characters."
      )
      return
    }

    setLoading(true)

    try {
      const response =
        await fetch(
          "/api/auth/reset-password",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              token,
              password,
            }),
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to reset password."
        )
        return
      }

      setSuccess(true)

      setMessage(
        "Your password has been reset successfully."
      )

      setPassword("")
      setConfirmPassword("")
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
      <h1>Reset Password</h1>

      {!token ? (
        <>
          <p>
            This reset link is invalid.
          </p>

          <Link href="/forgot-password">
            Request a new reset link
          </Link>
        </>
      ) : (
        <>
          <form
            onSubmit={handleSubmit}
          >
            <div>
              <label htmlFor="password">
                New password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                minLength={8}
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword">
                Confirm password
              </label>

              <input
                id="confirmPassword"
                type="password"
                value={
                  confirmPassword
                }
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                minLength={8}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Resetting..."
                : "Reset Password"}
            </button>
          </form>

          {message && (
            <p>{message}</p>
          )}

          {success && (
            <p>
              <Link href="/login">
                Continue to login
              </Link>
            </p>
          )}
        </>
      )}
    </main>
  )
}