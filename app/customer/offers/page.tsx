// app/customer/offers/page.tsx
"use client"

import { useEffect, useState } from "react"
import { getAllProductsWithOffers } from "@/app/actions/products-new"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Offer = {
  id: number
  product_id: number
  quantity: number
  price: number
}

type Product = {
  id: number
  name: string
  description: string
  price: number
  category: string
  type: string
  active: boolean
  image_url?: string
  offers: Offer[]
}

export default function CustomerOffersPage() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    async function fetchData() {
      const data = await getAllProductsWithOffers()
      setProducts(data)
    }
    fetchData()
  }, [])

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 p-4">
      {products.map((product) => (
        <Card key={product.id} className="p-4 space-y-4">
          {product.image_url && (
            <Image
              src={product.image_url}
              alt={product.name}
              width={300}
              height={200}
              className="rounded"
            />
          )}
          <div>
            <h2 className="text-xl font-bold">{product.name}</h2>
            <p className="text-sm text-muted-foreground">{product.description}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Base Price: ${product.price}</p>
            <div>
              <h4 className="text-sm font-semibold mb-1">Available Offers:</h4>
              {product.offers.map((offer) => (
                <div key={offer.id} className="border rounded p-2 flex justify-between items-center">
                  <span>{offer.quantity} units for ${offer.price}</span>
                  <Button size="sm" variant="outline">Choose</Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
