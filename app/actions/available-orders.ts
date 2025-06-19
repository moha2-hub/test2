"use server"

import { query } from "@/lib/db"
import { getCurrentUser } from "./auth"

export async function getAvailableOrdersForSeller() {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") {
    return []
  }

  try {
    // Get pending orders without castle login credentials (hidden until accepted)
    const orders = await query(`
      SELECT 
        o.id, o.amount, o.quantity, o.created_at,
        json_build_object('name', p.name, 'price', p.price) as product,
        json_build_object('name', c.name) as castle,
        json_build_object('username', cu.username) as customer
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN castles c ON o.castle_id = c.id
      JOIN users cu ON o.customer_id = cu.id
      WHERE o.status = 'pending' AND o.seller_id IS NULL
      ORDER BY o.created_at DESC
    `)

    return orders
  } catch (error) {
    console.error("Get available orders error:", error)
    return []
  }
}

export async function getAcceptedOrdersForSeller() {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") {
    return []
  }

  try {
    // Get accepted orders WITH castle login credentials (visible after acceptance)
    const orders = await query(
      `
      SELECT 
        o.id, o.amount, o.quantity, o.created_at, o.status,
        json_build_object('name', p.name, 'price', p.price) as product,
        json_build_object('name', c.name, 'login_credentials', c.login_credentials) as castle,
        json_build_object('username', cu.username) as customer
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN castles c ON o.castle_id = c.id
      JOIN users cu ON o.customer_id = cu.id
      WHERE o.seller_id = $1 AND o.status IN ('accepted', 'completed')
      ORDER BY o.created_at DESC
    `,
      [user.id],
    )

    return orders
  } catch (error) {
    console.error("Get accepted orders error:", error)
    return []
  }
}
