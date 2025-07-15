import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { PaymentSuccessContent } from "./payment-success-content"

export default function PaymentSuccessPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading payment status...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  )
} 