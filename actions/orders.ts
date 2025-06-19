"use server"

import { query } from "@/lib/db"
import { cookies } from "next/headers"

// Get the current user ID from cookies
async function getCurrentUserId() {
  const userId = cookies().get("userId")?.value
  if (!userId) return null
  return Number.parseInt(userId, 10)
}

// Get the current user role from cookies
async function getCurrentUserRole() {
  return cookies().get("userRole")?.value
}

// Accept an order (for sellers)
export async function acceptOrder(orderId: number) {
  const userId = await getCurrentUserId()
  const userRole = await getCurrentUserRole()

  if (!userId || userRole !== "seller") {
    return { success: false, message: "Unauthorized" }
  }

  try {
    // Start a transaction
    await query("BEGIN")

    // Check if the order exists and is pending
    const orderCheck = await query("SELECT id, status, seller_id, customer_id FROM orders WHERE id = $1", [orderId])

    if (orderCheck.length === 0) {
      await query("ROLLBACK")
      return { success: false, message: "Order not found" }
    }

    const order = orderCheck[0]

    // Check if the order is already accepted by another seller
    if (order.status !== "pending" || order.seller_id) {
      await query("ROLLBACK")
      return { success: false, message: "Order is already accepted or not available" }
    }

    // Make sure seller is not accepting their own order
    if (order.customer_id === userId) {
      await query("ROLLBACK")
      return { success: false, message: "You cannot accept your own order" }
    }

    // Update the order
    await query("UPDATE orders SET seller_id = $1, status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = $2", [
      userId,
      orderId,
    ])

    // Create a notification for the customer
    await query(
      `INSERT INTO notifications (user_id, title, message, type, reference_id)
       VALUES ($1, 'Order Accepted', 'Your order has been accepted by a seller', 'order', $2)`,
      [order.customer_id, orderId],
    )

    await query("COMMIT")
    return { success: true }
  } catch (error) {
    await query("ROLLBACK")
    console.error("Error accepting order:", error)
    return { success: false, message: "An error occurred while accepting the order" }
  }
}

// Complete an order (for sellers)
export async function completeOrder(orderId: number) {
  const userId = await getCurrentUserId()
  const userRole = await getCurrentUserRole()

  if (!userId || userRole !== "seller") {
    return { success: false, message: "Unauthorized" }
  }

  try {
    // Start a transaction
    await query("BEGIN")

    // Check if the order exists and is assigned to this seller
    const orderCheck = await query(
      "SELECT id, status, seller_id, customer_id, amount FROM orders WHERE id = $1 AND seller_id = $2",
      [orderId, userId],
    )

    if (orderCheck.length === 0) {
      await query("ROLLBACK")
      return { success: false, message: "Order not found or not assigned to you" }
    }

    const order = orderCheck[0]

    // Check if the order is in the correct status
    if (order.status !== "accepted") {
      await query("ROLLBACK")
      return { success: false, message: "Order cannot be completed at this stage" }
    }

    // Update the order status
    await query("UPDATE orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [orderId])

    // Add points to seller's balance
    await query("UPDATE users SET points = points + $1 WHERE id = $2", [order.amount, userId])

    // Remove reserved points from customer
    await query("UPDATE users SET reserved_points = reserved_points - $1 WHERE id = $2", [
      order.amount,
      order.customer_id,
    ])

    // Create a notification for the customer
    await query(
      `INSERT INTO notifications (user_id, title, message, type, reference_id)
       VALUES ($1, 'Order Completed', 'Your order has been completed', 'order', $2)`,
      [order.customer_id, orderId],
    )

    // Create a transaction record for the payment
    await query(
      `INSERT INTO transactions (user_id, type, amount, status, notes, created_at)
       VALUES ($1, 'payment', $2, 'completed', 'Payment for order #' || $3, CURRENT_TIMESTAMP)`,
      [userId, order.amount, orderId],
    )

    await query("COMMIT")
    return { success: true }
  } catch (error) {
    await query("ROLLBACK")
    console.error("Error completing order:", error)
    return { success: false, message: "An error occurred while completing the order" }
  }
}

// Cancel an order (for customers or admin)
export async function cancelOrder(orderId: number) {
  const userId = await getCurrentUserId()
  const userRole = await getCurrentUserRole()

  if (!userId) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    // Start a transaction
    await query("BEGIN")

    // Check if the order exists
    const orderCheck = await query("SELECT id, status, customer_id, seller_id, amount FROM orders WHERE id = $1", [
      orderId,
    ])

    if (orderCheck.length === 0) {
      await query("ROLLBACK")
      return { success: false, message: "Order not found" }
    }

    const order = orderCheck[0]

    // Check permissions
    const isAdmin = userRole === "admin"
    const isCustomer = userRole === "customer" && order.customer_id === userId
    const isSeller = userRole === "seller" && order.seller_id === userId

    if (!isAdmin && !isCustomer && !isSeller) {
      await query("ROLLBACK")
      return { success: false, message: "You don't have permission to cancel this order" }
    }

    // Check if the order can be cancelled
    if (!["pending", "accepted"].includes(order.status)) {
      await query("ROLLBACK")
      return { success: false, message: "Order cannot be cancelled at this stage" }
    }

    // Update the order status
    await query("UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [orderId])

    // Refund points to customer
    await query("UPDATE users SET points = points + $1, reserved_points = reserved_points - $1 WHERE id = $2", [
      order.amount,
      order.customer_id,
    ])

    // Create notifications
    if (order.seller_id) {
      await query(
        `INSERT INTO notifications (user_id, title, message, type, reference_id)
         VALUES ($1, 'Order Cancelled', 'An order you were assigned to has been cancelled', 'order', $2)`,
        [order.seller_id, orderId],
      )
    }

    await query(
      `INSERT INTO notifications (user_id, title, message, type, reference_id)
       VALUES ($1, 'Order Cancelled', 'Your order has been cancelled', 'order', $2)`,
      [order.customer_id, orderId],
    )

    await query("COMMIT")
    return { success: true }
  } catch (error) {
    await query("ROLLBACK")
    console.error("Error cancelling order:", error)
    return { success: false, message: "An error occurred while cancelling the order" }
  }
}

// Get orders for the current user
export async function getOrders() {
  const userId = await getCurrentUserId()
  const userRole = await getCurrentUserRole()

  if (!userId) {
    return { success: false, orders: [] }
  }

  try {
    let orders = []

    if (userRole === "admin") {
      // Admin can see all orders
      orders = await query(`
        SELECT 
          o.id, o.status, o.amount, o.created_at,
          c.username as customer_name,
          s.username as seller_name,
          p.name as product_name,
          ca.name as castle_name
        FROM orders o
        JOIN users c ON o.customer_id = c.id
        LEFT JOIN users s ON o.seller_id = s.id
        JOIN products p ON o.product_id = p.id
        JOIN castles ca ON o.castle_id = ca.id
        ORDER BY o.created_at DESC
      `)
    } else if (userRole === "seller") {
      // Seller can see orders assigned to them
      orders = await query(
        `
        SELECT 
          o.id, o.status, o.amount, o.created_at,
          c.username as customer_name,
          p.name as product_name,
          ca.name as castle_name,
          ca.login_credentials
        FROM orders o
        JOIN users c ON o.customer_id = c.id
        JOIN products p ON o.product_id = p.id
        JOIN castles ca ON o.castle_id = ca.id
        WHERE o.seller_id = $1
        ORDER BY o.created_at DESC
      `,
        [userId],
      )
    } else if (userRole === "customer") {
      // Customer can see their own orders
      orders = await query(
        `
        SELECT 
          o.id, o.status, o.amount, o.created_at,
          s.username as seller_name,
          p.name as product_name,
          ca.name as castle_name
        FROM orders o
        LEFT JOIN users s ON o.seller_id = s.id
        JOIN products p ON o.product_id = p.id
        JOIN castles ca ON o.castle_id = ca.id
        WHERE o.customer_id = $1
        ORDER BY o.created_at DESC
      `,
        [userId],
      )
    }

    return { success: true, orders }
  } catch (error) {
    console.error("Error fetching orders:", error)
    return { success: false, orders: [] }
  }
}

// Get a specific order by ID
export async function getOrder(orderId: number) {
  const userId = await getCurrentUserId()
  const userRole = await getCurrentUserRole()

  if (!userId) {
    return { success: false, order: null }
  }

  try {
    let order = null

    if (userRole === "admin") {
      // Admin can see any order
      const orders = await query(
        `
        SELECT 
          o.id, o.status, o.amount, o.created_at,
          c.username as customer_name,
          s.username as seller_name,
          p.name as product_name,
          ca.name as castle_name,
          ca.login_credentials
        FROM orders o
        JOIN users c ON o.customer_id = c.id
        LEFT JOIN users s ON o.seller_id = s.id
        JOIN products p ON o.product_id = p.id
        JOIN castles ca ON o.castle_id = ca.id
        WHERE o.id = $1
        LIMIT 1
      `,
        [orderId],
      )

      order = orders.length > 0 ? orders[0] : null
    } else if (userRole === "seller") {
      // Seller can only see orders assigned to them
      const orders = await query(
        `
        SELECT 
          o.id, o.status, o.amount, o.created_at,
          c.username as customer_name,
          p.name as product_name,
          ca.name as castle_name,
          ca.login_credentials
        FROM orders o
        JOIN users c ON o.customer_id = c.id
        JOIN products p ON o.product_id = p.id
        JOIN castles ca ON o.castle_id = ca.id
        WHERE o.id = $1 AND o.seller_id = $2
        LIMIT 1
      `,
        [orderId, userId],
      )

      order = orders.length > 0 ? orders[0] : null
    } else if (userRole === "customer") {
      // Customer can only see their own orders
      const orders = await query(
        `
        SELECT 
          o.id, o.status, o.amount, o.created_at,
          s.username as seller_name,
          p.name as product_name,
          ca.name as castle_name
        FROM orders o
        LEFT JOIN users s ON o.seller_id = s.id
        JOIN products p ON o.product_id = p.id
        JOIN castles ca ON o.castle_id = ca.id
        WHERE o.id = $1 AND o.customer_id = $2
        LIMIT 1
      `,
        [orderId, userId],
      )

      order = orders.length > 0 ? orders[0] : null
    }

    return { success: true, order }
  } catch (error) {
    console.error("Error fetching order:", error)
    return { success: false, order: null }
  }
}

// Create a new order (for customers)
export async function createOrder(formData: FormData) {
  const userId = await getCurrentUserId()
  const userRole = await getCurrentUserRole()

  if (!userId || userRole !== "customer") {
    return { success: false, message: "Only customers can create orders" }
  }

  const productId = Number(formData.get("productId"))
  const castleId = Number(formData.get("castleId"))
  const quantity = Number(formData.get("quantity") || "1")

  if (isNaN(productId) || isNaN(castleId) || isNaN(quantity) || quantity < 1) {
    return { success: false, message: "Invalid input data" }
  }

  try {
    // Start a transaction
    await query("BEGIN")

    // Check if the product exists and is active
    const productCheck = await query("SELECT id, name, price, active FROM products WHERE id = $1", [productId])

    if (productCheck.length === 0 || !productCheck[0].active) {
      await query("ROLLBACK")
      return { success: false, message: "Product not found or not available" }
    }

    const product = productCheck[0]

    // Check if the castle exists and belongs to the user
    const castleCheck = await query("SELECT id FROM castles WHERE id = $1 AND user_id = $2", [castleId, userId])

    if (castleCheck.length === 0) {
      await query("ROLLBACK")
      return { success: false, message: "Castle not found or doesn't belong to you" }
    }

    // Calculate total amount
    const totalAmount = product.price * quantity

    // Check if the user has enough points
    const userCheck = await query("SELECT points FROM users WHERE id = $1", [userId])

    if (userCheck.length === 0 || userCheck[0].points < totalAmount) {
      await query("ROLLBACK")
      return { success: false, message: "Not enough points" }
    }

    // Deduct points from user's balance and add to reserved points
    await query("UPDATE users SET points = points - $1, reserved_points = reserved_points + $1 WHERE id = $2", [
      totalAmount,
      userId,
    ])

    // Create the order
    const orderResult = await query(
      `INSERT INTO orders (
        customer_id, product_id, castle_id, status, amount, quantity, created_at, updated_at
      ) VALUES (
        $1, $2, $3, 'pending', $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING id`,
      [userId, productId, castleId, totalAmount, quantity],
    )

    const orderId = orderResult[0].id

    // Create a transaction record
    await query(
      `INSERT INTO transactions (
        user_id, type, amount, status, notes, created_at
      ) VALUES (
        $1, 'payment', $2, 'completed', 'Payment for order #' || $3, CURRENT_TIMESTAMP
      )`,
      [userId, totalAmount, orderId],
    )

    // Notify sellers about the new order
    await query(
      `INSERT INTO notifications (
        user_id, title, message, type, reference_id
      ) SELECT 
        id, 'New Order Available', 'A new order is available for you to accept', 'order', $1
      FROM users WHERE role = 'seller'`,
      [orderId],
    )

    await query("COMMIT")
    return { success: true, orderId }
  } catch (error) {
    await query("ROLLBACK")
    console.error("Error creating order:", error)
    return { success: false, message: "An error occurred while creating the order" }
  }
}