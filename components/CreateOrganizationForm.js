"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CreateOrganizationForm() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.message || "Failed to create organization")
        return
      }

      setMessage("Organization created successfully!")

      setName("")
      setDescription("")

      router.refresh()
    } catch (error) {
      console.error(error)
      setMessage("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">
          Organization name
        </label>

        <input
          id="name"
          type="text"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          required
        />
      </div>

      <div>
        <label htmlFor="description">
          Description
        </label>

        <textarea
          id="description"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
        />
      </div>

      <button
        type="submit"
        disabled={loading}
      >
        {loading
          ? "Creating..."
          : "Create Organization"}
      </button>

      <p>{message}</p>
    </form>
  )
}