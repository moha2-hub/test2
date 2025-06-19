import { cookies } from "next/headers"
import { query } from "@/lib/db"

// Define the User type
export interface User {
  id: number
  username: string
  email: string
  role: string
  points: number
  reserved_points: number
}

// Get the current user from cookies
export async function getCurrentUser(): Promise<User | null> {
  try {
    const userId = cookies().get("userId")?.value

    if (!userId) {
      return null
    }

    const users = await query<User>("SELECT * FROM users WHERE id = $1 LIMIT 1", [Number.parseInt(userId)])

    return users.length > 0 ? users[0] : null
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

// Check if the user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

// Check if the user has a specific role
export async function hasRole(role: string): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null && user.role === role
}
