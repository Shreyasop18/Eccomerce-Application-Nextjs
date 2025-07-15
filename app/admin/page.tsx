"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, User } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminPage() {
    const router = useRouter()
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const username = formData.get("username")
        const password = formData.get("password")

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Hardcoded credentials check
            if (username === "admin" && password === "admin@100") {
                // Add a small delay before redirect for smooth transition
                await new Promise(resolve => setTimeout(resolve, 500))
                router.push("/admin/dashboard")
            } else {
                setError("Invalid credentials")
                setLoading(false)
            }
        } catch (err) {
            setError("An error occurred. Please try again.")
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-xl border-0">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Admin Login
                    </CardTitle>
                    <CardDescription className="text-center">
                        Enter your credentials to access the admin panel
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <div className="relative">
                                <Input
                                    id="username"
                                    name="username"
                                    placeholder="Enter your username"
                                    required
                                    className="pl-10"
                                    disabled={loading}
                                />
                                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    required
                                    className="pl-10"
                                    disabled={loading}
                                />
                                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            </div>
                        </div>
                        {error && (
                            <div className="text-sm text-red-500 text-center">
                                {error}
                            </div>
                        )}
                        <Button 
                            type="submit" 
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}