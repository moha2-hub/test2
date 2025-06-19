"use server"

import { query } from "@/lib/db"
import { getCurrentUser } from "./auth"

// Get seller wallet data including points and withdrawal history
export async function getSellerWalletData() {
  const user = await getCurrentUser()

  if (!user || user.role !== "seller") {
    return { points: 0, withdrawals: [] }
  }

  try {
    // Get user's current points
    const userData = await query("SELECT points FROM users WHERE id = $1 LIMIT 1", [user.id])

    const points = userData.length > 0 ? userData[0].points : 0

    // Get withdrawal history (transactions of type 'payout')
    const withdrawals = await query(
      `SELECT 
        id, 
        amount, 
        status, 
        created_at 
      FROM transactions 
      WHERE user_id = $1 AND type = 'payout' 
      ORDER BY created_at DESC`,
      [user.id],
    )

    return {
      points,
      withdrawals,
    }
  } catch (error) {
    console.error("Error fetching seller wallet data:", error)
    return { points: 0, withdrawals: [] }
  }
}

// Request a withdrawal of points
export async function requestWithdrawal(amount: number) {
  const user = await getCurrentUser()

  if (!user || user.role !== "seller") {
    return { success: false, message: "Only sellers can request withdrawals" }
  }

  if (!amount || amount <= 0) {
    return { success: false, message: "Invalid withdrawal amount" }
  }

  try {
    // Start transaction
    await query("BEGIN")

    // Check if user has enough points
    const userData = await query("SELECT points FROM users WHERE id = $1 LIMIT 1", [user.id])

    if (userData.length === 0) {
      await query("ROLLBACK")
      return { success: false, message: "User not found" }
    }

    const userPoints = userData[0].points

    if (userPoints < amount) {
      await query("ROLLBACK")
      return { success: false, message: "Insufficient points" }
    }

    // Deduct points from user's balance
    await query("UPDATE users SET points = points - $1 WHERE id = $2", [amount, user.id])

    // Create withdrawal transaction
    await query(
      `INSERT INTO transactions 
        (user_id, type, amount, status, payment_method, notes, created_at) 
      VALUES 
        ($1, 'payout', $2, 'pending', NULL, 'Withdrawal request', CURRENT_TIMESTAMP)`,
      [user.id, amount],
    )

    // Create notification for admins
    await query(
      `INSERT INTO notifications 
        (user_id, title, message, type, reference_id) 
      SELECT 
        id, 'New Withdrawal Request', 'A seller has requested a withdrawal', 'payment', NULL
      FROM users WHERE role = 'admin'`,
    )

    // Commit transaction
    await query("COMMIT")

    return { success: true }
  } catch (error) {
    // Rollback transaction on error
    await query("ROLLBACK")
    console.error("Withdrawal request error:", error)
    return { success: false, message: "Failed to process withdrawal request" }
  }
}
