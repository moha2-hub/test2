"use server"

import { query } from "@/lib/db"
import type { Order } from "@/types/database"
import { getCurrentUser } from "./auth"

// Build SELECT query based on role
function getOrderSelectQuery(role: string) {
  const baseFields = `
    o.id, o.status, o.amount, o.quantity, o.created_at,
    json_build_object('name', p.name, 'price', p.price) as product,
    json_build_object('name', c.name, 'account', c.igg_account, 'password', c.password${role !== "customer" ? ", 'login_credentials', c.login_credentials" : ""}) as castle
  `

  if (role === "admin") {
    return `
      SELECT 
        o.id, o.customer_id, o.seller_id, o.status, o.amount, o.quantity, o.created_at,
        json_build_object('name', p.name, 'price', p.price) as product,
        json_build_object('name', c.name) as castle,
        json_build_object('username', cu.username) as customer,
        CASE WHEN o.seller_id IS NOT NULL THEN 
          json_build_object('username', su.username)
        ELSE NULL END as seller
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN castles c ON o.castle_id = c.id
      JOIN users cu ON o.customer_id = cu.id
      LEFT JOIN users su ON o.seller_id = su.id
    `
  }

  return `
    SELECT ${baseFields}
    FROM orders o
    JOIN products p ON o.product_id = p.id
    JOIN castles c ON o.castle_id = c.id
  `
}

// Get orders for current user
export async function getOrdersByUserId(): Promise<any[]> {
  const user = await getCurrentUser()
  if (!user) return []

  try {
    let queryStr = getOrderSelectQuery(user.role)
    let result: any[] = []

    if (user.role === "customer") {
      queryStr += ` WHERE o.customer_id = $1 ORDER BY o.created_at DESC`
      result = await query(queryStr, [user.id])
    } else if (user.role === "seller") {
      queryStr += ` WHERE o.seller_id = $1 ORDER BY o.created_at DESC`
      result = await query(queryStr, [user.id])
    } else if (user.role === "admin") {
      queryStr += ` ORDER BY o.created_at DESC`
      result = await query(queryStr)
    }

    return result
  } catch (error) {
    console.error("Get orders error:", error)
    return []
  }
}

// Get a single order by ID
export async function getOrderById(id: number): Promise<any | null> {
  const user = await getCurrentUser()
  if (!user) return null

  try {
    let queryStr = getOrderSelectQuery(user.role)
    let result: any[] = []

    if (user.role === "customer") {
      queryStr += ` WHERE o.id = $1 AND o.customer_id = $2 LIMIT 1`
      result = await query(queryStr, [id, user.id])
    } else if (user.role === "seller") {
      queryStr += ` WHERE o.id = $1 AND o.seller_id = $2 LIMIT 1`
      result = await query(queryStr, [id, user.id])
    } else if (user.role === "admin") {
      queryStr += ` WHERE o.id = $1 LIMIT 1`
      result = await query(queryStr, [id])
    }

    return result.length > 0 ? result[0] : null
  } catch (error) {
    console.error("Get order by ID error:", error)
    return null
  }
}

// Create a new order with quantity and calculated amount
export async function createOrder(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || user.role !== "customer") {
    return { success: false, message: "Only customers can create orders" }
  }

  const productId = Number(formData.get("productId"))
  const castleId = Number(formData.get("castleId"))
  const quantity = Number(formData.get("quantity")) || 1 // Default 1 if not provided
  const offerId = formData.get("offerId") ? Number(formData.get("offerId")) : null

  // Fetch product before using it
  const productRes = await query("SELECT * FROM products WHERE id = $1 AND active = true LIMIT 1", [productId])
  if (productRes.length === 0) {
    return { success: false, message: "Product not found or inactive" }
  }
  const product = productRes[0]

  let totalPrice = product.price * quantity

  // If an offer is selected, use its price as the total price
  if (offerId) {
    const offerRes = await query("SELECT price FROM offers WHERE id = $1 AND product_id = $2 AND is_active = true LIMIT 1", [offerId, productId])
    if (offerRes.length > 0) {
      totalPrice = offerRes[0].price
    }
  }

  if (isNaN(productId) || isNaN(castleId) || isNaN(quantity) || quantity <= 0) {
    return { success: false, message: "Invalid product, castle ID, or quantity" }
  }

  try {
    await query("BEGIN")

    // Check castle ownership
    const castleRes = await query("SELECT * FROM castles WHERE id = $1 AND user_id = $2 LIMIT 1", [castleId, user.id])
    if (castleRes.length === 0) {
      await query("ROLLBACK")
      return { success: false, message: "Castle not found or not owned by you" }
    }

    // Check user points
    if (user.points < totalPrice) {
      await query("ROLLBACK")
      return { success: false, message: "Insufficient points" }
    }

    // Deduct points and add reserved points
    await query(
      `UPDATE users SET points = points - $1, reserved_points = reserved_points + $1 WHERE id = $2`,
      [Math.round(totalPrice), user.id]
    )

    // Insert order with quantity and total amount
    const insertRes = await query(
      `INSERT INTO orders (customer_id, product_id, castle_id, status, amount, quantity, total_price, created_at, updated_at)
       VALUES ($1, $2, $3, 'pending', $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id`,
      [user.id, productId, castleId, Math.round(totalPrice), quantity, Math.round(totalPrice)]
    )

    const orderId = insertRes[0].id

    // Notify sellers
    await query(
      `INSERT INTO notifications (user_id, title, message, type, reference_id)
       SELECT id, 'New Order Available', 'A new order is available for you to accept', 'order', $1
       FROM users WHERE role = 'seller'`,
      [orderId]
    )

    await query("COMMIT")
    return { success: true, orderId }
  } catch (error) {
    await query("ROLLBACK")
    console.error("Create order error:", error)
    return { success: false, message: "Failed to create order" }
  }
}

// Accept order (seller only)
export async function acceptOrder(orderId: number) {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") {
    return { success: false, message: "Only sellers can accept orders" }
  }

  try {
    await query("BEGIN")

    const existing = await query<Order>("SELECT customer_id FROM orders WHERE id = $1 LIMIT 1", [orderId]) as Order[]
    if (existing.length === 0 || existing[0].customer_id === user.id) {
      await query("ROLLBACK")
      return { success: false, message: "Cannot accept this order" }
    }

    const update = await query<Order>(
      `UPDATE orders SET seller_id = $1, status = 'accepted', updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND status = 'pending' AND seller_id IS NULL RETURNING customer_id`,
      [user.id, orderId]
    ) as Order[]

    if (update.length === 0) {
      await query("ROLLBACK")
      return { success: false, message: "Order already accepted" }
    }

    const customerId = update[0].customer_id

    await query(
      `INSERT INTO notifications (user_id, title, message, type, reference_id)
       VALUES ($1, 'Order Accepted', 'Your order has been accepted by a seller', 'order', $2)`,
      [customerId, orderId]
    )

    await query("COMMIT")
    return { success: true }
  } catch (error) {
    await query("ROLLBACK")
    console.error("Accept order error:", error)
    return { success: false, message: "Failed to accept order" }
  }
}

// Complete order (seller only)
export async function completeOrder(orderId: number) {
  const user = await getCurrentUser()
  if (!user || user.role !== "seller") {
    return { success: false, message: "Only sellers can complete orders" }
  }

  try {
    await query("BEGIN")

    const orderRes = await query<Order>(
      "SELECT * FROM orders WHERE id = $1 AND seller_id = $2 LIMIT 1",
      [orderId, user.id]
    ) as Order[]

    if (orderRes.length === 0) {
      await query("ROLLBACK")
      return { success: false, message: "Order not found or not assigned to you" }
    }

    const order = orderRes[0]

    // Pay seller points equal to order amount
    await query(`UPDATE users SET points = points + $1 WHERE id = $2`, [order.amount, user.id])
    // Remove reserved points from customer
    await query(`UPDATE users SET reserved_points = reserved_points - $1 WHERE id = $2`, [order.amount, order.customer_id])
    // Update order status
    await query(`UPDATE orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [orderId])

    // Notify customer
    await query(
      `INSERT INTO notifications (user_id, title, message, type, reference_id)
       VALUES ($1, 'Order Completed', 'Your order has been completed by the seller', 'order', $2)`,
      [order.customer_id, orderId]
    )

    await query("COMMIT")
    return { success: true }
  } catch (error) {
    await query("ROLLBACK")
    console.error("Complete order error:", error)
    return { success: false, message: "Failed to complete order" }
  }
}

// Cancel order (admin, customer, seller)
export async function cancelOrder(orderId: number) {
  const user = await getCurrentUser()
  if (!user) return { success: false, message: "Not authenticated" }

  try {
    await query("BEGIN")

    const orderRes = await query<Order>("SELECT * FROM orders WHERE id = $1 LIMIT 1", [orderId]) as Order[]
    if (orderRes.length === 0) {
      await query("ROLLBACK")
      return { success: false, message: "Order not found" }
    }

    const order = orderRes[0]
    const canCancel =
      user.role === "admin" ||
      (user.role === "customer" && order.customer_id === user.id) ||
      (user.role === "seller" && order.seller_id === user.id)

    if (!canCancel) {
      await query("ROLLBACK")
      return { success: false, message: "You do not have permission to cancel this order" }
    }

    // Only allow cancel if order is not accepted by a seller
    if (order.seller_id) {
      await query("ROLLBACK")
      return { success: false, message: "Order has already been accepted by a seller and cannot be cancelled" }
    }

    if (!["pending", "accepted"].includes(order.status)) {
      await query("ROLLBACK")
      return { success: false, message: "Order cannot be cancelled at this stage" }
    }

    // Refund points to customer and remove reserved points
    await query(
      `UPDATE users SET points = points + $1, reserved_points = reserved_points - $1 WHERE id = $2`,
      [order.amount, order.customer_id]
    )

    await query(`UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [orderId])

    if (order.seller_id) {
      await query(
        `INSERT INTO notifications (user_id, title, message, type, reference_id)
         VALUES ($1, 'Order Cancelled', 'An order you were assigned to has been cancelled', 'order', $2)`,
        [order.seller_id, orderId]
      )
    }

    await query(
      `INSERT INTO notifications (user_id, title, message, type, reference_id)
       VALUES ($1, 'Order Cancelled', 'Your order has been cancelled', 'order', $2)`,
      [order.customer_id, orderId]
    )

    await query("COMMIT")
    return { success: true }
  } catch (error) {
    await query("ROLLBACK")
    console.error("Cancel order error:", error)
    return { success: false, message: "Failed to cancel order" }
  }
}
