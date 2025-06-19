"use server"

import { query } from "@/lib/db"

export async function getOffers() {
  return await query(`SELECT id, title, description FROM offers WHERE active = true`)
}

export async function getOffersByProduct(productId: number) {
  return await query(
    `SELECT id, title, description, quantity, price FROM offers WHERE product_id = $1 AND is_active = true`,
    [productId]
  )
}

export async function createOffer({ productId, title, description, quantity, price }: {
  productId: number,
  title: string,
  description: string,
  quantity: number,
  price: number
}) {
  return await query(
    `INSERT INTO offers (product_id, title, description, quantity, price, is_active) VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
    [productId, title, description, quantity, price]
  )
}
