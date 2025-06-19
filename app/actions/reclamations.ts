"use server"

import { query } from "@/lib/db"
import { getCurrentUser } from "./auth"

export async function submitReclamation(orderId: string, subject: string, message: string) {
  const user = await getCurrentUser()
  if (!user) return { success: false, message: "Not authenticated" }

  try {
    await query(
      `INSERT INTO reclamations (order_id, customer_id, description, status, created_at)
       VALUES ($1, $2, $3, 'pending', NOW())`,
      [orderId, user.id, `${subject}\n${message}`],
    )
    return { success: true }
  } catch (error) {
    console.error("Submit reclamation error:", error)
    return { success: false, message: "Failed to submit reclamation" }
  }
}
