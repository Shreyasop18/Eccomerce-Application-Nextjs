"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ShoppingCart, CreditCard, Lock } from "lucide-react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

// Load Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CartItem {
  id: string
  userId: string
  productId: string
  quantity: number
  price: number
  itemTotal: number
  cartNumber: string
  cartDate: string
  product: {
    id: string
    name: string
    description: string
    price: number
    imageUrl: string | null
  }
}

interface ShippingAddress {
  fullName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  phone: string
}

function CheckoutForm({ 
  cartItems, 
  shippingAddress, 
  total, 
  paymentIntentId,
  onSuccess 
}: { 
  cartItems: CartItem[]
  shippingAddress: ShippingAddress
  total: number
  paymentIntentId: string
  onSuccess: (orderId: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()
  const [processing, setProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  // Add payment element change handler
  const handlePaymentChange = (event: any) => {
    setIsComplete(event.complete);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    // Check if payment element is complete
    if (!isComplete) {
      toast({
        title: 'Invalid Payment Details',
        description: 'Please enter your complete card information before proceeding.',
        variant: 'destructive',
      })
      return;
    }

    // Prevent multiple submissions
    if (processing) return;

    setProcessing(true)
    try {
      // Get user email from auth
      const authRes = await fetch('/api/auth/user')
      if (!authRes.ok) throw new Error('Authentication required')
      const { user } = await authRes.json()

      // Check if order already exists for this payment intent
      const existingOrderRes = await fetch(`/api/orders/by-payment-intent/${paymentIntentId}`, {
        headers: {
          'user-email': user.email
        }
      })
      
      let orderData;
      if (existingOrderRes.ok) {
        // Order already exists, use it
        orderData = await existingOrderRes.json()
      } else {
        // Create new order
        const orderRes = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'user-email': user.email,
          },
          body: JSON.stringify({
            items: cartItems,
            shippingAddress,
            paymentIntentId,
            status: 'RECEIVED',
            paymentStatus: 'succeeded'
          }),
        })
        if (!orderRes.ok) throw new Error('Failed to create order')
        orderData = await orderRes.json()
      }

      // Then confirm payment
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation`,
        },
        redirect: 'if_required',
      })
      if (error) throw new Error(error.message || 'Payment failed')

      // Clear cart only after both order creation and payment confirmation succeed
      await fetch('/api/cart/clear', { 
        method: 'POST',
        headers: { 'user-email': user.email }
      })
      onSuccess(orderData.id)
    } catch (error) {
      console.error('Payment error:', error)
      toast({
        title: 'Payment Failed',
        description: error instanceof Error ? error.message : 'Failed to process payment. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Lock className="h-4 w-4" />
          <span>Your payment information is secure and encrypted</span>
        </div>
        
        <PaymentElement onChange={handlePaymentChange} />
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        disabled={!stripe || processing || !isComplete}
        onClick={(e) => {
          if (processing) {
            e.preventDefault();
            return false;
          }
        }}
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay ₹{total.toLocaleString('en-IN')}
          </>
        )}
      </Button>
    </form>
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [paymentIntentCreated, setPaymentIntentCreated] = useState(false)
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    phone: ""
  })
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const loadCart = async () => {
      try {
        const authRes = await fetch('/api/auth/user')
        if (!authRes.ok) {
          router.push('/login')
          return
        }
        const { user } = await authRes.json()
        setUserEmail(user.email)

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

  // Fetch clientSecret and paymentIntentId after cart and userEmail are loaded
  useEffect(() => {
    const fetchClientSecret = async () => {
      if (!userEmail || cartItems.length === 0 || paymentIntentCreated) return
      const total = cartItems.reduce((sum, item) => sum + Number(item.itemTotal), 0)
      if (total <= 0) return
      setPaymentIntentCreated(true) // Set before fetch to prevent race
      const res = await fetch('/api/payment/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-email': userEmail,
        },
        body: JSON.stringify({ amount: total, currency: 'inr' }),
      })
      if (res.ok) {
        const data = await res.json()
        setClientSecret(data.clientSecret)
        setPaymentIntentId(data.paymentIntentId)
      } else {
        setClientSecret(null)
        setPaymentIntentId(null)
        setPaymentIntentCreated(false)
      }
    }
    fetchClientSecret()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail, cartItems])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setShippingAddress(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePaymentSuccess = (orderId: string) => {
    router.push(`/order-confirmation?orderId=${orderId}`)
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

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Your cart is empty</CardTitle>
              <CardDescription>Add some products to checkout.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/dashboard')}>
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
          <ShoppingCart className="h-7 w-7" /> Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shipping Address Form */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
              <CardDescription>Enter your shipping details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={shippingAddress.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Address Line 1</Label>
                  <Input
                    id="addressLine1"
                    name="addressLine1"
                    value={shippingAddress.addressLine1}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                  <Input
                    id="addressLine2"
                    name="addressLine2"
                    value={shippingAddress.addressLine2}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={shippingAddress.postalCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <div className="space-y-6">
            {/* Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>Complete your purchase securely</CardDescription>
              </CardHeader>
              <CardContent>
                {clientSecret && paymentIntentId ? (
                  <Elements 
                    stripe={stripePromise}
                    options={{ clientSecret }}
                  >
                    <CheckoutForm
                      cartItems={cartItems}
                      shippingAddress={shippingAddress}
                      total={cartItems.reduce((sum, item) => sum + Number(item.itemTotal), 0)}
                      paymentIntentId={paymentIntentId}
                      onSuccess={handlePaymentSuccess}
                    />
                  </Elements>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading payment form...</div>
                )}
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Review your items</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center space-x-4">
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
                      <p className="text-sm font-medium">{item.product.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-sm font-medium">
                      {formatPrice(Number(item.itemTotal))}
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">{formatPrice(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 