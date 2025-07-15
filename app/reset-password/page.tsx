import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { ResetPasswordForm } from "./ResetPasswordForm"

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Suspense fallback={
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          </CardContent>
        </Card>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
} 