"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/custom-dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Package, Bot, Zap, Calendar, Percent } from "lucide-react"
import Link from "next/link"
import { getProducts, updateProduct, deleteProduct } from "@/app/actions/products"
  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;
    setIsLoading(true);
    const result = await deleteProduct(productId);
    if (result.success) {
      setProducts(products.filter((p) => p.id !== productId));
    } else {
      alert(result.message || "Failed to delete product.");
    }
    setIsLoading(false);
  };
import { createOffer, getOffersByProduct, deleteOffer } from "@/app/actions/products-new"
import { useTranslation } from "react-i18next"
// Use a single Offer type from the backend for consistency
import type { Offer } from "@/app/actions/products-new"

type Product = {
  id: number
  name: string
  description: string
  price: number
  category: string
  type: string
  active: boolean
  image_url?: string
  purchaseType?: "offer" | "quantity" | "both" // <-- Add this
}

export default function AdminProductsPage() {
  const { t } = useTranslation("common");
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [offers, setOffers] = useState<{ [key: number]: Offer[] }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [editingPrice, setEditingPrice] = useState<number | null>(null)
  const [newPrice, setNewPrice] = useState("")
  const [offerDialog, setOfferDialog] = useState<number | null>(null)
  // Update newOffer state to include title and description
  const [newOffer, setNewOffer] = useState({ quantity: "", price: "", title: "", description: "" })
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [activeTab, products])

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const data = await getProducts(false) // Get all products including inactive
      setProducts(data)

      // Load offers for each product
      const offersData: { [key: number]: Offer[] } = {}
      for (const product of data) {
        const productOffers = await getOffersByProduct(product.id)
        offersData[product.id] = productOffers
      }
      setOffers(offersData)
    } catch (error) {
      console.error("Failed to load products:", error)
    }
    setIsLoading(false)
  }

  const filterProducts = () => {
    if (activeTab === "all") {
      setFilteredProducts(products)
    } else {
      setFilteredProducts(products.filter((p) => p.category === activeTab || p.type === activeTab))
    }
  }

  const handlePriceUpdate = async (productId: number) => {
    if (!newPrice || isNaN(Number(newPrice)) || Number(newPrice) < 0) {
      console.error("Invalid newPrice value:", newPrice)
      return
    }

    // Debug log
    const product = products.find((p) => p.id === productId)
    console.log("handlePriceUpdate:", { productId, newPrice, product })

    const formData = new FormData()
    formData.append("id", productId.toString())
    formData.append("price", newPrice)

    // Get current product data
    if (product) {
      formData.append("name", product.name)
      formData.append("description", product.description)
      formData.append("imageUrl", product.image_url || "")
      formData.append("active", product.active.toString())
      formData.append("category", product.category)
      formData.append("type", product.type)
    }

    const result = await updateProduct(formData)
    if (result.success) {
      setProducts(products.map((p) => (p.id === productId ? { ...p, price: Number(newPrice) } : p)))
      setEditingPrice(null)
      setNewPrice("")
    }
  }

  const handleStatusToggle = async (productId: number, newStatus: boolean) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    const formData = new FormData()
    formData.append("id", productId.toString())
    formData.append("name", product.name)
    formData.append("description", product.description)
    formData.append("price", product.price.toString())
    formData.append("imageUrl", product.image_url || "")
    formData.append("active", newStatus.toString())
    formData.append("category", product.category)
    formData.append("type", product.type)

    const result = await updateProduct(formData)
    if (result.success) {
      setProducts(products.map((p) => (p.id === productId ? { ...p, active: newStatus } : p)))
    }
  }

  // Handler to create a new offer
  const handleCreateOffer = async (productId: number) => {
    if (!newOffer.quantity || !newOffer.price) return

    // Debug: Log productId when creating an offer
    console.log('Creating offer for productId:', productId, newOffer)

    const formData = new FormData()
    formData.append("productId", productId.toString())
    formData.append("quantity", newOffer.quantity)
    formData.append("price", newOffer.price)
    if (newOffer.title) formData.append("title", newOffer.title)
    if (newOffer.description) formData.append("description", newOffer.description)

    const result = await createOffer(formData)
    if (result.success) {
      const productOffers = await getOffersByProduct(productId)
      setOffers(prev => ({
        ...prev,
        [productId]: productOffers,
      }))
      setNewOffer({ quantity: "", price: "", title: "", description: "" })
      setOfferDialog(null)
    }
  }

  // Handler to remove an offer by id
  const handleRemoveOffer = async (productId: number, offerId: number) => {
    const result = await deleteOffer(offerId)
    if (result.success) {
      // Reload offers for this product only
      const productOffers = await getOffersByProduct(productId)
      setOffers(prev => ({
        ...prev,
        [productId]: productOffers,
      }))
    }
  }

  const handleEditSave = async () => {
    if (!editingProduct) return
    setIsLoading(true)
    try {
      // Call your update API here, e.g.:
      // await updateProduct(editingProduct)
      // Or update state directly if local
      setProducts(products.map(p => p.id === editingProduct.id ? editingProduct : p))
      setEditingProduct(null)
    } catch (error) {
      // Show error toast
    } finally {
      setIsLoading(false)
    }
  }

  const getProductIcon = (category: string) => {
    switch (category) {
      case "bots":
        return <Bot className="h-5 w-5" />
      case "resources":
        return <Zap className="h-5 w-5" />
      case "recharge":
        return <Package className="h-5 w-5" />
      case "events":
        return <Calendar className="h-5 w-5" />
      default:
        return <Package className="h-5 w-5" />
    }
  }

  const categories = [
    { id: "all", name: "All Products", icon: Package },
    { id: "recharge", name: "Recharge", icon: Package },
    { id: "bots", name: "Bots", icon: Bot },
    { id: "resources", name: "Resources", icon: Zap },
    { id: "events", name: "Events", icon: Calendar },
  ]

  if (isLoading) {
    return (
      <DashboardLayout userRole="admin">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading products...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t("productManagement")}</h1>
          <Link href="/admin/products/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("addNewProduct")}
            </Button>
          </Link>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {t(category.name)}
                </TabsTrigger>
              )
            })}
          </TabsList>
          <TabsContent value={activeTab} className="mt-6">
            {filteredProducts.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          {getProductIcon(product.category)}
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={product.active}
                            onCheckedChange={(checked) => handleStatusToggle(product.id, checked)}
                          />
                          <Badge variant={product.active ? "default" : "secondary"}>
                            {product.active ? t("active") : t("inactive")}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600">{product.description}</p>
                      {/* Price Management */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">{t("priceControl")}</Label>
                        <div className="flex items-center gap-2">
                          {editingPrice === product.id ? (
                            <>
                              <Input
                                type="number"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                placeholder={t("newPrice")}
                                className="flex-1"
                              />
                              <Button size="sm" onClick={() => handlePriceUpdate(product.id)}>
                                {t("save")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingPrice(null)
                                  setNewPrice("")
                                }}
                              >
                                {t("cancel")}
                              </Button>
                            </>
                          ) : (
                            <>
                              <span className="text-lg font-semibold flex-1">{product.price} {t("points")}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingPrice(product.id)
                                  setNewPrice(product.price.toString())
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Offers Management */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm font-medium">{t("quantityOffers")}</Label>
                          <Dialog
                            open={offerDialog === product.id}
                            onOpenChange={(open) => setOfferDialog(open ? product.id : null)}
                          >
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Percent className="h-4 w-4 mr-1" />
                                {t("addOffer")}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{t("createQuantityOfferFor", { name: product.name })}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>{t("offerTitle")}</Label>
                                  <Input
                                    type="text"
                                    value={newOffer.title || ""}
                                    onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
                                    placeholder={t("offerTitlePlaceholder")}
                                  />
                                </div>
                                <div>
                                  <Label>{t("offerDescription")}</Label>
                                  <Input
                                    type="text"
                                    value={newOffer.description || ""}
                                    onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                                    placeholder={t("offerDescriptionPlaceholder")}
                                  />
                                </div>
                                <div>
                                  <Label>{t("quantity")}</Label>
                                  <Input
                                    type="number"
                                    value={newOffer.quantity}
                                    onChange={(e) => setNewOffer({ ...newOffer, quantity: e.target.value })}
                                    placeholder={t("minQuantity")}
                                  />
                                </div>
                                <div>
                                  <Label>{t("specialPrice")}</Label>
                                  <Input
                                    type="number"
                                    value={newOffer.price}
                                    onChange={(e) => setNewOffer({ ...newOffer, price: e.target.value })}
                                    placeholder={t("priceForQuantity")}
                                  />
                                </div>
                                <Button onClick={() => handleCreateOffer(product.id)} className="w-full">
                                  {t("createOffer")}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        {offers[product.id] && offers[product.id].length > 0 ? (
                          <div className="space-y-1">
                            {offers[product.id].map((offer) => (
                              <div key={offer.id} className="flex flex-col bg-gray-50 p-2 rounded mb-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold">{offer.title}</span>
                                  <span className="font-medium">{offer.price}</span>
                                  <Button size="icon" variant="ghost" onClick={() => handleRemoveOffer(product.id, offer.id)} title={t("removeOffer")}>✕</Button>
                                </div>
                                <div className="text-xs text-gray-500 mb-1">{offer.description}</div>
                                <div className="flex justify-between items-center text-sm">
                                  <span>{offer.quantity}+ {t("items")}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">{t("noQuantityOffers")}</p>
                        )}
                      </div>
                      {/* Purchase Type Management */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">{t("purchaseType")}</Label>
                        <select
                          value={product.purchaseType || "quantity"}
                          onChange={(e) =>
                            setProducts(
                              products.map((p) =>
                                p.id === product.id
                                  ? { ...p, purchaseType: e.target.value as "offer" | "quantity" | "both" }
                                  : p
                              )
                            )}
                          className="border rounded p-2"
                        >
                          <option value="quantity">{t("quantityOnly")}</option>
                          <option value="offer">{t("offerOnly")}</option>
                          <option value="both">{t("both")}</option>
                        </select>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <Badge variant="outline">{t(product.category)}</Badge>
                        <div className="flex gap-2">
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4 mr-1" />
                              {t("editDetails")}
                            </Button>
                          </Link>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteProduct(product.id)}>
                            {t("delete")}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  {activeTab === "all" ? t("noProductsFound") : t("noProductsInCategory", { category: t(activeTab) })}
                </p>
                <Link href="/admin/products/new">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("addFirstProduct")}
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{products.length}</div>
              <div className="text-sm text-gray-600">{t("totalProducts")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{products.filter((p) => p.active).length}</div>
              <div className="text-sm text-gray-600">{t("activeProducts")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{Object.values(offers).flat().length}</div>
              <div className="text-sm text-gray-600">{t("totalOffers")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{filteredProducts.length}</div>
              <div className="text-sm text-gray-600">{t("filteredResults")}</div>
            </CardContent>
          </Card>
        </div>
        {/* Edit Product Dialog */}
        {editingProduct && (
          <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("editProductDetails")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Label>{t("name")}</Label>
                <Input
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
                <Label>{t("description")}</Label>
                <Input
                  value={editingProduct.description}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                />
                <Label>{t("price")}</Label>
                <Input
                  type="number"
                  value={editingProduct.price}
                  onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                />
                <Label>{t("purchaseType")}</Label>
                <select
                  value={editingProduct.purchaseType}
                  onChange={e =>
                    setEditingProduct({ ...editingProduct, purchaseType: e.target.value as "offer" | "quantity" | "both" })
                  }
                  className="border rounded p-2"
                >
                  <option value="quantity">{t("quantityOnly")}</option>
                  <option value="offer">{t("offerOnly")}</option>
                  <option value="both">{t("both")}</option>
                </select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingProduct(null)}>
                  {t("cancel")}
                </Button>
                <Button onClick={handleEditSave}>
                  {t("save")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  )
}

// Add these keys to your translation files:
// "productManagement": "Product Management",
// "addNewProduct": "Add New Product",
// "active": "Active",
// "inactive": "Inactive",
// "priceControl": "Price Control",
// "newPrice": "New price",
// "save": "Save",
// "cancel": "Cancel",
// "points": "Points",
// "quantityOffers": "Quantity Offers",
// "addOffer": "Add Offer",
// "createQuantityOfferFor": "Create Quantity Offer for {{name}}",
// "quantity": "Quantity",
// "minQuantity": "Minimum quantity",
// "specialPrice": "Special Price",
// "priceForQuantity": "Price for this quantity",
// "createOffer": "Create Offer",
// "items": "items",
// "noQuantityOffers": "No quantity offers",
// "purchaseType": "Purchase Type",
// "quantityOnly": "Quantity Only",
// "offerOnly": "Offer Only",
// "both": "Both",
// "editDetails": "Edit Details",
// "noProductsFound": "No products found",
// "noProductsInCategory": "No products in {{category}} category",
// "addFirstProduct": "Add First Product",
// "totalProducts": "Total Products",
// "activeProducts": "Active Products",
// "totalOffers": "Total Offers",
// "filteredResults": "Filtered Results",
// "editProductDetails": "Edit Product Details",
// "name": "Name",
// "description": "Description",
// "price": "Price",
// "purchaseType": "Purchase Type",
// "quantityOnly": "Quantity Only",
// "offerOnly": "Offer Only",
// "both": "Both",
// "cancel": "Cancel",
// "save": "Save",
// "offerTitle": "Offer Title",
// "offerDescription": "Offer Description",
// "offerTitlePlaceholder": "Enter offer title",
// "offerDescriptionPlaceholder": "Enter offer description",
// "selected": "Selected",
// "selectOffer": "Select Offer",
// "totalPrice": "Total Price",
