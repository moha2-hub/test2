// app/action/accept/page.tsx
import { acceptOrder } from "@/actions/orders"
import { redirect } from "next/navigation"

export default async function AcceptPage({ searchParams }: { searchParams: { orderId?: string } }) {
  const orderId = Number(searchParams.orderId)

  if (isNaN(orderId)) {
    return <div>Invalid order ID</div>
  }

  const result = await acceptOrder(orderId)

  if (result.success) {
    redirect("/dashboard?message=Order accepted")
  } else {
    return <div>Error: {result.message}</div>
  }
}
