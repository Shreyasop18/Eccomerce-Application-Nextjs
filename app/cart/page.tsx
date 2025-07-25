"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2, ShoppingCart, ArrowLeft, Plus, Minus } from "lucide-react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Category {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string | null
  categoryId: string
  category: Category
  createdAt: string
  updatedAt: string
}

interface CartItem {
  id: string
  userId: string
  productId: string
  quantity: number
  price: number
  itemTotal: number
  cartNumber: string
  cartDate: string
  product: Product
}

export default function CartPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userLoaded, setUserLoaded] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  // Validate auth and load cart
  useEffect(() => {
    const loadCart = async () => {
      try {
        const authRes = await fetch('/api/auth/user')
        if (!authRes.ok) {
          router.push('/login')
          return
        }
        setUserLoaded(true)

        const cartRes = await fetch('/api/cart')
        if (!cartRes.ok) {
          throw new Error('Failed to load cart')
        }
        const items = await cartRes.json()
        setCartItems(items)
      } catch (error) {
        console.error('Failed to load cart:', error)
        toast({
          title: 'Error',
          description: 'Failed to load cart items',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    loadCart()
  }, [router, toast])

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          quantity: newQuantity
        })
      })

      if (!res.ok) {
        throw new Error('Failed to update quantity')
      }

      const updatedItem = await res.json()
      setCartItems(prev => prev.map(item => 
        item.productId === productId ? updatedItem : item
      ))
    } catch (error) {
      console.error('Failed to update quantity:', error)
      toast({
        title: 'Error',
        description: 'Failed to update quantity',
        variant: 'destructive'
      })
    }
  }

  const removeFromCart = async (productId: string) => {
    try {
      const res = await fetch(`/api/cart?productId=${productId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        throw new Error('Failed to remove item')
      }

      setCartItems(prev => prev.filter(item => item.productId !== productId))
    } catch (error) {
      console.error('Failed to remove item:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove item from cart',
        variant: 'destructive'
      })
    }
  }

  const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  }).format(price)

  const total = cartItems.reduce((sum, item) => sum + Number(item.itemTotal), 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-2 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7" /> Your Cart
          </h1>
          <Button variant="outline" onClick={() => router.push('/dashboard')} className="flex items-center gap-2 py-2 px-3 text-sm sm:text-base">
            <ArrowLeft className="h-4 w-4" /> Continue Shopping
          </Button>
        </div>

        {cartItems.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Your cart is empty</CardTitle>
              <CardDescription>Add some products to see them here.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 overflow-x-auto rounded-lg border bg-card">
              <div className="min-w-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px] sm:w-[100px]">Product</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[60px] sm:w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cartItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="relative h-14 w-14 sm:h-20 sm:w-20 rounded-md overflow-hidden">
                            {item.product.imageUrl ? (
                              <Image 
                                src={item.product.imageUrl} 
                                alt={item.product.name} 
                                fill 
                                className="object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                                No image
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm sm:text-base">{item.product.name}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                              {item.product.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-base">{formatPrice(Number(item.price))}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 sm:w-12 text-center font-medium text-sm sm:text-base">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-xs sm:text-base">
                          {formatPrice(Number(item.itemTotal))}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="w-full max-w-xs lg:max-w-sm mx-auto lg:mx-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Order Summary</CardTitle>
                  <CardDescription className="text-xl sm:text-2xl font-bold text-blue-600">
                    {formatPrice(total)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-2 text-sm sm:text-base"
                    onClick={() => router.push('/checkout')}
                  >
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 