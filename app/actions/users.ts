"use server"

import { query } from "@/lib/db"
import type { User } from "@/types/database"
import { getCurrentUser } from "./auth"

export async function getUsers(): Promise<User[]> {
  const currentUser = await getCurrentUser()

  if (!currentUser || currentUser.role !== "admin") {
    return []
  }

  return await query<User>("SELECT * FROM users ORDER BY username")
}

export async function updateUserRole(userId: number, newRole: "customer" | "seller" | "admin") {
  const currentUser = await getCurrentUser()

  if (!currentUser || currentUser.role !== "admin") {
    return { success: false, message: "Only admins can update user roles" }
  }

  try {
    await query("UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [newRole, userId])

    // Create notification for the user
    await query(
      `INSERT INTO notifications (user_id, title, message, type, reference_id) 
       VALUES ($1, 'Role Updated', 'Your account role has been updated to ' || $2, 'system', NULL)`,
      [userId, newRole],
    )

    return { success: true }
  } catch (error) {
    console.error("Update user role error:", error)
    return { success: false, message: "Failed to update user role" }
  }
}

export async function createUser(formData: FormData) {
  const currentUser = await getCurrentUser()

  if (!currentUser || currentUser.role !== "admin") {
    return { success: false, message: "Only admins can create users" }
  }

  const username = formData.get("username") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as "customer" | "seller" | "admin"

  // Check if user already exists
  const existingUsers = await query<User>("SELECT * FROM users WHERE email = $1 OR username = $2 LIMIT 1", [
    email,
    username,
  ])

  if (existingUsers.length > 0) {
    return { success: false, message: "User already exists" }
  }

  // In a real app, you would hash the password
  const passwordHash = password

  try {
    const result = await query(
      `INSERT INTO users (username, email, password_hash, role, points, reserved_points) 
       VALUES ($1, $2, $3, $4, 0, 0) RETURNING id`,
      [username, email, passwordHash, role],
    )

    return { success: true, userId: result[0].id }
  } catch (error) {
    console.error("Create user error:", error)
    return { success: false, message: "Failed to create user" }
  }
}
