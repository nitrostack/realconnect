"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AcceptInvitationButton({
  token,
}) {
  const router = useRouter()

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState("")

  async function handleAccept() {
    setLoading(true)
    setError("")

    try {
      const response =
        await fetch(
          "/api/organizations/invitations/accept",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              token,
            }),
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to accept invitation."
        )

        return
      }

      /*
       * The membership now exists.
       *
       * Send the user to the dashboard.
       */
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      console.error(
        "Accept invitation error:",
        error
      )

      setError(
        "Something went wrong while accepting the invitation."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <p
          style={{
            color: "red",
            marginBottom: "10px",
          }}
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleAccept}
        disabled={loading}
      >
        {loading
          ? "Accepting..."
          : "Accept Invitation"}
      </button>
    </div>
  )
}