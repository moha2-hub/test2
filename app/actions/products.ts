"use server"

import { query } from "@/lib/db"
import type { Product } from "@/types/database"
import { getCurrentUser } from "./auth"

export async function deleteProduct(id: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { success: false, message: "Unauthorized" };
  }
  try {
    await query("DELETE FROM products WHERE id = $1", [id]);
    return { success: true };
  } catch (error) {
    console.error("Delete product error:", error);
    return { success: false, message: "Failed to delete product" };
  }
}

export async function getProducts(activeOnly = true): Promise<Product[]> {
  try {
    const whereClause = activeOnly ? "WHERE active = true" : ""
    const products = await query<Product>(`SELECT * FROM products ${whereClause} ORDER BY name`)
    return products || []
  } catch (error) {
    console.error("Get products error:", error)
    return []
  }
}

export async function getProductById(id: number): Promise<Product | null> {
  const products = await query<Product>("SELECT * FROM products WHERE id = $1 LIMIT 1", [id])
  return products.length > 0 ? products[0] : null
}

export async function createProduct(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") {
    return { success: false, message: "Unauthorized" }
  }

  const name = formData.get("name") as string
  const price = Number.parseInt(formData.get("price") as string)
  const category = formData.get("productType") as string
  const imageFile = formData.get("image") as File | null
  let imageUrl = ""
  if (imageFile) {
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    imageUrl = `data:${imageFile.type};base64,${buffer.toString('base64')}`;
  }

  const description = ""
  const type = ""

  try {
    const result = await query<{ id: number }>(
      `INSERT INTO products (name, description, price, image_url, active, category, type)
       VALUES ($1, $2, $3, $4, true, $5, $6) RETURNING id`,
      [name, description, price, imageUrl, category, type],
    )
    return { success: true, productId: result[0].id }
  } catch (error) {
    console.error("Create product error:", error)
    return { success: false, message: "Failed to create product" }
  }
}

export async function updateProduct(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") {
    return { success: false, message: "Unauthorized" }
  }

  const id = Number.parseInt(formData.get("id") as string)
  const current = await getProductById(id)
  if (!current) {
    return { success: false, message: "Product not found" }
  }

  const name = formData.get("name")?.toString().trim() || current.name
  const description = formData.get("description")?.toString().trim() || current.description
  const price = formData.get("price") ? parseFloat(formData.get("price") as string) : current.price
  const imageUrl = formData.get("imageUrl")?.toString().trim() || current.image_url || ""
  const active = formData.get("active") ? formData.get("active") === "true" : current.active
  const category = formData.get("category")?.toString().trim() || current.category
  const type = formData.get("type")?.toString().trim() || current.type

  console.log("Updating product:", { id, name, description, price, imageUrl, active, category, type })

  if (isNaN(price) || price < 0) {
    console.error("Invalid price value:", price)
    return { success: false, message: "Invalid price value" }
  }

  try {
    await query(
      `UPDATE products 
       SET name = $1, description = $2, price = $3, image_url = $4, active = $5, category = $6, type = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [name, description, price, imageUrl, active, category, type, id],
    )

    return { success: true }
  } catch (error) {
    console.error("Update product error:", error)
    return { success: false, message: "Failed to update product" }
  }
}
