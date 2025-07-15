"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const paymentIntentId = searchParams.get('payment_intent')
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret')

    if (paymentIntentId && paymentIntentClientSecret) {
      router.push(`/order-confirmation?paymentIntentId=${paymentIntentId}`)
    } else {
      setError('Invalid payment response')
      setLoading(false)
    }
  }, [searchParams, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Payment Error</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/checkout')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Checkout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
} 