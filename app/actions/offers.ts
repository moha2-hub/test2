"use server"

import { query } from "@/lib/db"

export async function getOffers() {
  try {
    return await query(
      `SELECT id, title, description FROM offers WHERE active = true`
    )
  } catch (error) {
    console.error("Get offers error:", error)
    return []
  }
}

export async function getOffersByProduct(productId: number) {
  try {
    return await query(
      `SELECT id, title, description, quantity, price 
       FROM offers 
       WHERE product_id = $1 AND is_active = true`,
      [productId]
    )
  } catch (error) {
    console.error("Get offers by product error:", error)
    return []
  }
}

export async function createOffer({
  productId,
  title,
  description,
  quantity,
  price
}: {
  productId: number
  title: string
  description: string
  quantity: number
  price: number
}) {
  try {
    const result = await query(
      `INSERT INTO offers (product_id, title, description, quantity, price, is_active) 
       VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
      [productId, title, description, quantity, price]
    )
    return { success: true, offerId: result[0].id }
  } catch (error) {
    console.error("Create offer error:", error)
    return { success: false, message: "Failed to create offer" }
  }
}

export async function deleteOffer(offerId: number) {
  try {
    await query(`DELETE FROM offers WHERE id = $1`, [offerId])
    return { success: true }
  } catch (error) {
    console.error("Delete offer error:", error)
    return { success: false, message: "Failed to delete offer" }
  }
}
