"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Package } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

interface OrderItem {
    id: string
    quantity: number
    price: number
    itemTotal: number
    product: {
        name: string
        description: string
        imageUrl: string | null
    }
}

interface Order {
    id: string
    status: string
    total: number
    createdAt: string
    items: OrderItem[]
    shippingAddress: {
        fullName: string
        address: string
        city: string
        state: string
        postalCode: string
        country: string
    }
}

export default function MyOrdersPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [user, setUser] = useState<{ email: string } | null>(null)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/user')
                if (!response.ok) {
                    router.push('/login')
                    return
                }
                const userData = await response.json()
                setUser(userData.user)
            } catch (error) {
                console.error('Auth check failed:', error)
                router.push('/login')
            }
        }

        checkAuth()
    }, [router])

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user?.email) return

            try {
                const response = await fetch('/api/orders', {
                    headers: {
                        'user-email': user.email
                    }
                })
                
                if (!response.ok) {
                    if (response.status === 401) {
                        router.push('/login')
                        return
                    }
                    throw new Error('Failed to fetch orders')
                }
                const data = await response.json()
                setOrders(data)
            } catch (error) {
                console.error('Error fetching orders:', error)
                setError('Failed to load orders. Please try again later.')
            } finally {
                setLoading(false)
            }
        }

        if (user) {
            fetchOrders()
        }
    }, [router, user])

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(price)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-muted-foreground">Loading orders...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 flex items-center justify-center">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle className="text-red-600">Error</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button 
                            onClick={() => window.location.reload()} 
                            variant="outline"
                            className="w-full"
                        >
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            My Orders
                        </h1>
                        <p className="text-gray-600">View and track your order history</p>
                    </div>
                </div>

                {orders.length === 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>No Orders Found</CardTitle>
                            <CardDescription>
                                You haven't placed any orders yet. Start shopping to see your orders here.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={() => router.push('/')}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                            >
                                Browse Products
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <Card key={order.id} className="overflow-hidden">
                                <CardHeader className="bg-gray-50">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Package className="h-5 w-5 text-blue-600" />
                                                Order #{order.id.slice(0, 8)}
                                            </CardTitle>
                                            <CardDescription>
                                                Placed on {formatDate(order.createdAt)}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-sm">
                                                <span className="font-semibold">Status: </span>
                                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium
                                                    ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                                                    ${order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' : ''}
                                                    ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : ''}
                                                    ${order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}
                                                `}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <div className="text-lg font-bold text-blue-600">
                                                {formatPrice(Number(order.total))}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-900 mb-2">Items</h3>
                                            <div className="divide-y divide-gray-200">
                                                {order.items.map((item) => (
                                                    <div key={item.id} className="py-4 flex items-center gap-4">
                                                        <div className="flex-1">
                                                            <h4 className="font-medium">{item.product.name}</h4>
                                                            <p className="text-sm text-gray-600">{item.product.description}</p>
                                                            <p className="text-sm text-gray-500">
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
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-900 mb-2">Shipping Address</h3>
                                            <div className="text-sm text-gray-600">
                                                <p>{order.shippingAddress.fullName}</p>
                                                <p>{order.shippingAddress.address}</p>
                                                <p>
                                                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                                                </p>
                                                <p>{order.shippingAddress.country}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
} 