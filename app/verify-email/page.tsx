"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link. Please check your email and try again.')
      return
    }

    verifyEmail(token)
  }, [searchParams])

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(data.message)
        setUser(data.user)
      } else {
        setStatus('error')
        setMessage(data.error || 'Verification failed')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />
      case 'error':
        return <XCircle className="w-12 h-12 text-red-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600'
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            {status === 'loading' ? (
              <Mail className="w-8 h-8 text-white" />
            ) : (
              getStatusIcon()
            )}
          </div>
          <CardTitle className={`text-2xl font-bold ${getStatusColor()}`}>
            {status === 'loading' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {status === 'loading' && 'Please wait while we verify your email address.'}
            {status === 'success' && 'Your email has been successfully verified.'}
            {status === 'error' && 'We encountered an issue verifying your email.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            
            {status === 'success' && user && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 font-medium">Welcome, {user.name}!</p>
                <p className="text-green-700 text-sm">Your account is now active.</p>
              </div>
            )}
            
            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">
                  The verification link may have expired or is invalid. 
                  Please check your email for a fresh verification link.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {status === 'success' && (
              <Button 
                onClick={() => router.push('/login')}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                Continue to Login
              </Button>
            )}
            
            {status === 'error' && (
              <>
                <Button 
                  onClick={() => router.push('/register')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Register Again
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/login')}
                  className="w-full"
                >
                  Go to Login
                </Button>
              </>
            )}
            
            <Button 
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full"
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
} 