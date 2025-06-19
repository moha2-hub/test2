"use server"

import { query } from "@/lib/db"
import { getCurrentUser } from "./auth"

export async function updateUserSettings(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, message: "Not authenticated" }
  }

  const username = formData.get("username") as string
  const email = formData.get("email") as string
  const whatsappNumber = formData.get("whatsappNumber") as string
  const currentPassword = formData.get("currentPassword") as string
  const newPassword = formData.get("newPassword") as string

  try {
    // Verify current password if changing password
    if (newPassword) {
      const userCheck = await query("SELECT password_hash FROM users WHERE id = $1 AND password_hash = $2", [
        user.id,
        currentPassword,
      ])

      if (userCheck.length === 0) {
        return { success: false, message: "Current password is incorrect" }
      }
    }

    // Check if email/username already exists for other users
    const existingUser = await query("SELECT id FROM users WHERE (email = $1 OR username = $2) AND id != $3", [
      email,
      username,
      user.id,
    ])

    if (existingUser.length > 0) {
      return { success: false, message: "Email or username already exists" }
    }

    // Update user information
    let updateQuery = `
      UPDATE users 
      SET username = $1, email = $2, whatsapp_number = $3, updated_at = CURRENT_TIMESTAMP
    `
    const params = [username, email, whatsappNumber]

    if (newPassword) {
      updateQuery += `, password_hash = $4`
      params.push(newPassword)
    }

    updateQuery += ` WHERE id = $${params.length + 1}`
    params.push(user.id)

    await query(updateQuery, params)

    return { success: true, message: "Settings updated successfully" }
  } catch (error) {
    console.error("Update settings error:", error)
    return { success: false, message: "Failed to update settings" }
  }
}

export async function getUserSettings() {
  const user = await getCurrentUser()
  if (!user) return null

  try {
    const result = await query("SELECT username, email, whatsapp_number FROM users WHERE id = $1", [user.id])
    return result[0] || null
  } catch (error) {
    console.error("Get user settings error:", error)
    return null
  }
}
