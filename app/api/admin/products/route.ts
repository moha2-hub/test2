import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const result = await query(
      "SELECT id, name, description, price, category, type, active FROM products ORDER BY created_at DESC",
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}
