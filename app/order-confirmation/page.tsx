"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, CheckCircle2, ArrowLeft, Package } from "lucide-react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  itemTotal: number
  product: {
    name: string
    imageUrl: string | null
  }
}

interface Order {
  id: string
  status: string
  shippingAddress: {
    fullName: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    postalCode: string
    phone: string
  }
  total: number
  orderItems: OrderItem[]
  createdAt: string
}

function OrderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const orderId = searchParams.get('orderId')
        const paymentIntentId = searchParams.get('paymentIntentId')
        
        if (!orderId && !paymentIntentId) {
          router.push('/dashboard')
          return
        }

        // Get user email from auth
        const authRes = await fetch('/api/auth/user')
        if (!authRes.ok) {
          throw new Error('Authentication required')
        }
        const { user } = await authRes.json()

        let res
        if (orderId) {
          res = await fetch(`/api/orders/${orderId}`, {
            headers: {
              'user-email': user.email
            }
          })
        } else if (paymentIntentId) {
          res = await fetch(`/api/orders/by-payment-intent/${paymentIntentId}`, {
            headers: {
              'user-email': user.email
            }
          })
        }

        if (!res || !res.ok) {
          throw new Error('Failed to load order')
        }
        const data = await res.json()
        setOrder(data)
      } catch (error) {
        console.error('Failed to load order:', error)
        toast({
          title: 'Error',
          description: 'Failed to load order details',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [router, searchParams, toast])

  const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  }).format(price)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Order not found</CardTitle>
              <CardDescription>The order you're looking for doesn't exist.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/dashboard')}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Success Message */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <h2 className="text-xl font-semibold text-green-800">Order Confirmed!</h2>
                <p className="text-green-600">Thank you for your purchase.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Details
                </CardTitle>
                <CardDescription>
                  Order #{order.id} • {formatDate(order.createdAt)}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Continue Shopping
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Shipping Address */}
            <div className="space-y-2">
              <h3 className="font-semibold">Shipping Address</h3>
              <div className="text-sm text-muted-foreground">
                <p>{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && (
                  <p>{order.shippingAddress.addressLine2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </p>
                <p>Phone: {order.shippingAddress.phone}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-4">
              <h3 className="font-semibold">Items</h3>
              <div className="divide-y">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="py-4 flex items-center gap-4">
                    <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
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
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity} × {formatPrice(Number(item.price))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(Number(item.itemTotal))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Total */}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span className="text-blue-600">{formatPrice(Number(order.total))}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <OrderContent />
    </Suspense>
  )
} 