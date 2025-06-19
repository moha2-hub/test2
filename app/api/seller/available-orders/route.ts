import { NextResponse } from "next/server"
import { getAvailableOrdersForSeller } from "@/app/actions/available-orders"

export async function GET() {
  try {
    const orders = await getAvailableOrdersForSeller()
    return NextResponse.json({ orders, success: true })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Failed to fetch orders", success: false }, { status: 500 })
  }
}
