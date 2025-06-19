"use server"

import { query } from "@/lib/db"
import type { Castle } from "@/types/database"
import { getCurrentUser } from "./auth"

export async function getCastlesByUserId(userId?: number): Promise<Castle[]> {
  const user = await getCurrentUser()

  if (!user) {
    return []
  }

  // If userId is provided and the current user is an admin, get castles for that user
  // Otherwise, get castles for the current user
  const targetUserId = userId && user.role === "admin" ? userId : user.id

  return await query<Castle>("SELECT * FROM castles WHERE user_id = $1 ORDER BY name", [targetUserId])
}

export async function getCastleById(id: number): Promise<Castle | null> {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const castles = await query<Castle>("SELECT * FROM castles WHERE id = $1 LIMIT 1", [id])

  if (castles.length === 0) {
    return null
  }

  const castle = castles[0]

  // Only allow access if the user owns the castle or is an admin
  if (castle.user_id !== user.id && user.role !== "admin") {
    return null
  }

  return castle
}

export async function createCastle(formData: FormData) {
  const user = await getCurrentUser()

  if (!user || user.role !== "customer") {
    return { success: false, message: "Only customers can add castles" }
  }

  const name = formData.get("name") as string
  const iggId = formData.get("iggId") as string // sequence of numbers
  const iggAccount = formData.get("iggAccount") as string // email
  const password = formData.get("password") as string // password

  try {
    const result = await query(
      `INSERT INTO castles (user_id, name, igg_id, igg_account, password) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [user.id, name, iggId, iggAccount, password],
    )

    return { success: true, castleId: result[0].id }
  } catch (error) {
    console.error("Create castle error:", error)
    return { success: false, message: "Failed to create castle" }
  }
}
