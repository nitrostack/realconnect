"use client"

import { useState } from "react"

export default function TeamManager({
  organizationId,
  currentUserId,
  currentUserRole,
  initialMembers,
  initialInvitations = [],
}) {
  const [members, setMembers] = useState(
    initialMembers || []
  )

  const [invitations, setInvitations] = useState(
    initialInvitations || []
  )

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("AGENT")

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const [loading, setLoading] = useState(false)
  const [inviting, setInviting] = useState(false)

  const [editingMemberId, setEditingMemberId] =
    useState(null)

  const [editingRole, setEditingRole] =
    useState("AGENT")

  const [actionLoadingId, setActionLoadingId] =
    useState(null)

  const isOrganizationAdmin =
    currentUserRole === "ORGANIZATION_ADMIN"

  async function handleInvite(event) {
    event.preventDefault()

    setMessage("")
    setError("")

    const email = inviteEmail.trim().toLowerCase()

    if (!email) {
      setError("Please enter an email address.")
      return
    }

    setInviting(true)

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/invitations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            role: inviteRole,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to send invitation."
        )
        return
      }

      /*
       * The invitation API returns:
       *
       * data.invitation
       *
       * This is intentionally added to the
       * invitations state, NOT the members state.
       */
      if (data.invitation) {
        setInvitations((currentInvitations) => [
          data.invitation,
          ...currentInvitations,
        ])
      }

      setInviteEmail("")
      setInviteRole("AGENT")

      setMessage(
        data.message ||
          "Invitation sent successfully."
      )
    } catch (error) {
      console.error(
        "Send invitation error:",
        error
      )

      setError(
        "Something went wrong while sending the invitation."
      )
    } finally {
      setInviting(false)
    }
  }

  async function handleRoleSave(memberId) {
    setMessage("")
    setError("")
    setActionLoadingId(memberId)

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/members`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            memberId,
            role: editingRole,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to update member role."
        )
        return
      }

      setMembers((currentMembers) =>
        currentMembers.map((member) => {
          if (member.id !== memberId) {
            return member
          }

          return {
            ...member,
            role: editingRole,
          }
        })
      )

      setEditingMemberId(null)

      setMessage(
        data.message ||
          "Member role updated successfully."
      )
    } catch (error) {
      console.error(
        "Update member role error:",
        error
      )

      setError(
        "Something went wrong while updating the member."
      )
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleRemoveMember(memberId) {
    setMessage("")
    setError("")

    const confirmed = window.confirm(
      "Are you sure you want to remove this member from the organization?"
    )

    if (!confirmed) {
      return
    }

    setActionLoadingId(memberId)

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/members`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            memberId,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to remove member."
        )
        return
      }

      setMembers((currentMembers) =>
        currentMembers.filter(
          (member) => member.id !== memberId
        )
      )

      setMessage(
        data.message ||
          "Member removed successfully."
      )
    } catch (error) {
      console.error(
        "Remove member error:",
        error
      )

      setError(
        "Something went wrong while removing the member."
      )
    } finally {
      setActionLoadingId(null)
    }
  }

  function startEditingMember(member) {
    setMessage("")
    setError("")

    setEditingMemberId(member.id)
    setEditingRole(member.role)
  }

  function cancelEditingMember() {
    setEditingMemberId(null)
    setEditingRole("AGENT")
  }

  function formatDate(dateValue) {
    if (!dateValue) {
      return ""
    }

    const date = new Date(dateValue)

    if (Number.isNaN(date.getTime())) {
      return ""
    }

    return date.toLocaleDateString()
  }

  function formatRole(role) {
    if (role === "ORGANIZATION_ADMIN") {
      return "Organization Admin"
    }

    if (role === "AGENT") {
      return "Agent"
    }

    return role
  }

  function isCurrentUser(member) {
    return (
      Number(member.user?.id) ===
      Number(currentUserId)
    )
  }

  return (
    <div>
      <h2>Team Management</h2>

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

      {isOrganizationAdmin && (
        <section>
          <h3>Invite Team Member</h3>

          <form onSubmit={handleInvite}>
            <div>
              <label htmlFor="invite-email">
                Email address
              </label>

              <br />

              <input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(event) =>
                  setInviteEmail(
                    event.target.value
                  )
                }
                placeholder="agent@example.com"
                required
              />
            </div>

            <br />

            <div>
              <label htmlFor="invite-role">
                Organization role
              </label>

              <br />

              <select
                id="invite-role"
                value={inviteRole}
                onChange={(event) =>
                  setInviteRole(
                    event.target.value
                  )
                }
              >
                <option value="AGENT">
                  Agent
                </option>

                <option value="ORGANIZATION_ADMIN">
                  Organization Admin
                </option>
              </select>
            </div>

            <br />

            <button
              type="submit"
              disabled={inviting}
            >
              {inviting
                ? "Sending invitation..."
                : "Send Invitation"}
            </button>
          </form>
        </section>
      )}

      <hr />

      <section>
        <h3>
          Pending Invitations (
          {invitations.length})
        </h3>

        {invitations.length === 0 ? (
          <p>
            There are no pending invitations.
          </p>
        ) : (
          <div>
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                style={{
                  border: "1px solid #ccc",
                  padding: "15px",
                  marginBottom: "10px",
                }}
              >
                <p>
                  <strong>
                    {invitation.email}
                  </strong>
                </p>

                <p>
                  Role:{" "}
                  {formatRole(
                    invitation.role
                  )}
                </p>

                <p>
                  Invited:{" "}
                  {formatDate(
                    invitation.createdAt
                  )}
                </p>

                <p>
                  Expires:{" "}
                  {formatDate(
                    invitation.expiresAt
                  )}
                </p>

                <p>
                  Status: Pending
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <hr />

      <section>
        <h3>
          Current Members ({members.length})
        </h3>

        {members.length === 0 ? (
          <p>
            There are no members in this
            organization.
          </p>
        ) : (
          <div>
            {members.map((member) => {
              const currentUser =
                isCurrentUser(member)

              const isEditing =
                editingMemberId === member.id

              const isLoading =
                actionLoadingId === member.id

              return (
                <div
                  key={member.id}
                  style={{
                    border: "1px solid #ccc",
                    padding: "15px",
                    marginBottom: "10px",
                  }}
                >
                  <p>
                    <strong>
                      {member.user?.name ||
                        "Unnamed user"}
                    </strong>
                  </p>

                  <p>
                    Email:{" "}
                    {member.user?.email}
                  </p>

                  {isEditing ? (
                    <div>
                      <label
                        htmlFor={`role-${member.id}`}
                      >
                        Organization role
                      </label>

                      <br />

                      <select
                        id={`role-${member.id}`}
                        value={editingRole}
                        onChange={(event) =>
                          setEditingRole(
                            event.target.value
                          )
                        }
                      >
                        <option value="AGENT">
                          Agent
                        </option>

                        <option value="ORGANIZATION_ADMIN">
                          Organization Admin
                        </option>
                      </select>

                      <br />
                      <br />

                      <button
                        type="button"
                        onClick={() =>
                          handleRoleSave(
                            member.id
                          )
                        }
                        disabled={isLoading}
                      >
                        {isLoading
                          ? "Saving..."
                          : "Save Role"}
                      </button>

                      {" "}

                      <button
                        type="button"
                        onClick={
                          cancelEditingMember
                        }
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p>
                      Role:{" "}
                      {formatRole(
                        member.role
                      )}
                    </p>
                  )}

                  {currentUser && (
                    <p>
                      <strong>
                        This is your account.
                      </strong>
                    </p>
                  )}

                  {isOrganizationAdmin &&
                    !currentUser &&
                    !isEditing && (
                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            startEditingMember(
                              member
                            )
                          }
                          disabled={isLoading}
                        >
                          Edit Role
                        </button>

                        {" "}

                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveMember(
                              member.id
                            )
                          }
                          disabled={isLoading}
                        >
                          {isLoading
                            ? "Removing..."
                            : "Remove"}
                        </button>
                      </div>
                    )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}