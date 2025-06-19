"use client"
import { DashboardLayout } from "@/components/custom-dashboard-layout"
import { useEffect, useState } from "react"
import { getProducts } from "@/app/actions/products"
import { getCastlesByUserId } from "@/app/actions/castles"
import { getOffers, getOffersByProduct } from "@/app/actions/offers"
import { createOrder } from "@/app/actions/orders"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"

type Product = {
  id: number
  name: string
  description: string | null
  price: number
  image_url: string | null
  purchaseType: "quantity" | "offer" | "both"
}

type Castle = {
  id: number
  name: string
}

type Offer = {
  id: number
  title: string
  description: string
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [castles, setCastles] = useState<Castle[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [offersByProduct, setOffersByProduct] = useState<{ [key: number]: any[] }>({})
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedCastle, setSelectedCastle] = useState<string>("")
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null)
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [totalPrice, setTotalPrice] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [userRole, setUserRole] = useState<"customer" | "admin">("customer") // Assuming a way to set userRole
  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    quantity: "",
    price: ""
  });
  const { toast } = useToast()

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        const [productsData, castlesData, offersData] = await Promise.all([
          getProducts(true),
          getCastlesByUserId(),
          getOffers(),
        ])
        setProducts(productsData)
        setCastles(castlesData)
        setOffers(offersData)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load products, castles, or offers",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [toast])

  async function handlePurchase() {
    if (!selectedProduct || !selectedCastle || !selectedOfferId) {
      toast({
        title: "Error",
        description: "Please select a castle and an offer",
        variant: "destructive",
      })
      return
    }
    if (quantity < 1) {
      toast({
        title: "Error",
        description: "Quantity must be at least 1",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // If an offer is selected, use its price as the total price
      const totalPrice = selectedOffer ? selectedOffer.price : selectedProduct.price * quantity
      const formData = new FormData()
      formData.append("productId", selectedProduct.id.toString())
      formData.append("castleId", selectedCastle)
      formData.append("quantity", quantity.toString())
      formData.append("totalPrice", totalPrice.toString())
      formData.append("offerId", selectedOfferId || "")

      // Include offer title and description if admin is adding a new offer
      if (userRole === "admin") {
        formData.append("title", offerForm.title);
        formData.append("description", offerForm.description);
      }

      const result = await createOrder(formData)

      if (result.success) {
        toast({ title: "Success", description: "Order placed successfully" })
        setIsDialogOpen(false)
        setSelectedProduct(null)
        setSelectedCastle("")
        setQuantity(1)
        setSelectedOfferId(null)
        setSelectedOffer(null)
        setOfferForm({ title: "", description: "", quantity: "", price: "" }) // Reset offer form
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to place order",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  function handleQuantityPurchase(product: Product) {
    setSelectedProduct(product)
    setQuantity(1)
    setSelectedCastle("")
    setSelectedOfferId(null)
    setIsDialogOpen(true)
  }

  // When a product is selected, load its offers
  function handleOfferPurchase(product: Product) {
    setSelectedProduct(product)
    setQuantity(1)
    setSelectedCastle("")
    setSelectedOfferId(null)
    setIsDialogOpen(true)
    // Load offers for this product
    getOffersByProduct(product.id).then((offers) => {
      setOffersByProduct((prev) => ({ ...prev, [product.id]: offers }))
    })
  }

  return (
    <DashboardLayout userRole="customer">
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Shop</h1>

        {castles.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-6">
            <p className="font-medium">You need to add a castle before you can make purchases</p>
            <Button asChild variant="link" className="p-0 h-auto">
              <a href="/customer/castles">Add Castle</a>
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading products...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="aspect-video bg-gray-100 relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle>{product.name}</CardTitle>
                  <CardDescription>{product.price} Points</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    {product.description || "No description available"}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => handleQuantityPurchase(product)}>
                    Buy
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No products available</p>
          </div>
        )}

        {/* Purchase Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Purchase</DialogTitle>
              <DialogDescription>
                {selectedProduct && (
                  <>
                    You are about to purchase <strong>{selectedProduct.name}</strong> for{" "}
                    <strong>{selectedProduct.price}</strong> points each.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="castle">Select Castle</Label>
                <Select value={selectedCastle} onValueChange={async (value) => {
                  setSelectedCastle(value)
                  setSelectedOfferId("")
                  setSelectedOffer(null)
                  setTotalPrice(0)
                  if (selectedProduct) {
                    const offers = await getOffersByProduct(selectedProduct.id)
                    setOffersByProduct((prev) => ({ ...prev, [selectedProduct.id]: offers }))
                  }
                }}>
                  <SelectTrigger id="castle">
                    <SelectValue placeholder="Select a castle" />
                  </SelectTrigger>
                  <SelectContent>
                    {castles.map((castle) => (
                      <SelectItem key={castle.id} value={castle.id.toString()}>
                        {castle.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Show offer selection only after a castle is selected */}
              {selectedProduct && selectedCastle && offersByProduct[selectedProduct.id] && offersByProduct[selectedProduct.id].length > 0 && (
                <div className="space-y-2">
                  <Label>Select Offer</Label>
                  {offersByProduct[selectedProduct.id].map((offer) => (
                    <div key={offer.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="offer"
                        value={offer.id}
                        checked={selectedOffer?.id === offer.id}
                        onChange={() => {
                          setSelectedOffer(offer)
                          setTotalPrice(offer.price)
                          setSelectedOfferId(offer.id.toString())
                        }}
                      />
                      <span className="font-semibold">{offer.title}</span>
                      <span className="text-xs text-gray-500">{offer.description}</span>
                      <span className="ml-auto font-medium">{offer.price} Points</span>
                    </div>
                  ))}
                </div>
              )}

              {(selectedProduct?.purchaseType === "quantity" ||
                selectedProduct?.purchaseType === "both") && (
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </div>
              )}

              {/* Offer title and description fields for admin */}
              {userRole === "admin" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="offerTitle">Offer Title</Label>
                    <Input id="offerTitle" name="offerTitle" value={offerForm.title} onChange={e => setOfferForm({ ...offerForm, title: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="offerDescription">Offer Description</Label>
                    <Input id="offerDescription" name="offerDescription" value={offerForm.description} onChange={e => setOfferForm({ ...offerForm, description: e.target.value })} required />
                  </div>
                </>
              )}

              <div>
                <p className="text-sm font-medium">
                  Total: <span className="text-green-600">{selectedOffer ? totalPrice : selectedProduct ? selectedProduct.price * quantity : 0} Points</span>
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePurchase} disabled={isLoading}>
                {isLoading ? "Processing..." : "Confirm Purchase"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
