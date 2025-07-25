"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ShoppingCart, ArrowUpDown, Calendar, Tag, DollarSign, LogOut, Menu, X, Package } from "lucide-react"
import Image from "next/image"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

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

type SortOption = 'price-high' | 'price-low' | 'latest' | null;

interface User {
    id: string;
    name: string;
    email: string;
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
}

export default function DashboardPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [user, setUser] = useState<User | null>(null)
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
    const [products, setProducts] = useState<Product[]>([])
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [sortBy, setSortBy] = useState<SortOption>(null)
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])
    const [maxPrice, setMaxPrice] = useState(1000)
    const [inputPriceRange, setInputPriceRange] = useState<{ min: string; max: string }>({ min: '0', max: '1000' })
    const [cartItems, setCartItems] = useState<CartItem[]>([])

    // Check authentication status and load cart
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

                // Load cart
                const cartRes = await fetch('/api/cart')
                if (cartRes.ok) {
                    const items = await cartRes.json()
                    setCartItems(items)
                }
            } catch (error) {
                console.error('Auth check failed:', error)
                router.push('/login')
            }
        }

        checkAuth()
    }, [router])

    // Handle logout
    const handleLogout = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST'
            })

            if (!response.ok) {
                throw new Error('Logout failed')
            }

            // Clear user data and redirect
            setUser(null)
            router.push('/login')
            toast({
                title: "Logged out successfully",
                description: "You have been logged out of your account.",
            })
        } catch (error) {
            console.error('Logout error:', error)
            toast({
                title: "Logout failed",
                description: "There was a problem logging out. Please try again.",
                variant: "destructive"
            })
        }
    }

    // Fetch products and categories
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsResponse, categoriesResponse] = await Promise.all([
                    fetch("/api/admin/products"),
                    fetch("/api/admin/categories")
                ])

                const productsData = await productsResponse.json()
                const categoriesData = await categoriesResponse.json()

                if (!productsResponse.ok) {
                    throw new Error("Failed to fetch products")
                }
                if (!categoriesResponse.ok) {
                    throw new Error("Failed to fetch categories")
                }

                // Calculate max price from products
                const maxProductPrice = Math.max(...productsData.map((p: Product) => p.price))
                setMaxPrice(Math.ceil(maxProductPrice))
                setPriceRange([0, Math.ceil(maxProductPrice)])
                setInputPriceRange({ min: '0', max: Math.ceil(maxProductPrice).toString() })

                setProducts(productsData)
                setFilteredProducts(productsData)
                setCategories(categoriesData)
            } catch (error) {
                console.error("Error fetching data:", error)
                setError("Failed to load data. Please try again later.")
            } finally {
                setLoading(false)
            }
        }

        if (user) {
            fetchData()
        }
    }, [user])

    // Handle manual price input
    const handlePriceInputChange = (type: 'min' | 'max', value: string) => {
        // Only allow numbers and empty string
        if (value !== '' && !/^\d*\.?\d*$/.test(value)) return

        setInputPriceRange(prev => ({
            ...prev,
            [type]: value
        }))

        // Update price range only if both values are valid numbers
        const minValue = type === 'min' ? parseFloat(value) || 0 : parseFloat(inputPriceRange.min) || 0
        const maxValue = type === 'max' ? parseFloat(value) || maxPrice : parseFloat(inputPriceRange.max) || maxPrice

        if (!isNaN(minValue) && !isNaN(maxValue)) {
            setPriceRange([
                Math.min(minValue, maxValue),
                Math.max(minValue, maxValue)
            ])
        }
    }

    // Apply filters and sorting
    useEffect(() => {
        let result = [...products]

        // Apply category filter
        if (selectedCategory) {
            result = result.filter(product => product.categoryId === selectedCategory)
        }

        // Apply price range filter
        result = result.filter(product => 
            product.price >= priceRange[0] && product.price <= priceRange[1]
        )

        // Apply sorting
        switch (sortBy) {
            case 'price-high':
                result.sort((a, b) => b.price - a.price)
                break
            case 'price-low':
                result.sort((a, b) => a.price - b.price)
                break
            case 'latest':
                result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                break
        }

        setFilteredProducts(result)
    }, [products, selectedCategory, sortBy, priceRange])

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0 // Remove decimal places for INR
        }).format(price)
    }

    const handleAddToCart = async (product: Product) => {
        const existingItem = cartItems.find(item => item.productId === product.id)
        
        if (existingItem) {
            toast({
                title: "Already in cart",
                description: `${product.name} is already in your cart.`,
            })
            return
        }
        
        try {
            const res = await fetch('/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productId: product.id,
                    quantity: 1
                })
            })

            if (!res.ok) {
                throw new Error('Failed to add to cart')
            }

            const newItem = await res.json()
            setCartItems(prev => [...prev, newItem])
            
            toast({
                title: "Added to cart",
                description: `${product.name} has been added to your cart.`,
            })
        } catch (error) {
            console.error('Failed to add to cart:', error)
            toast({
                title: 'Error',
                description: 'Failed to add item to cart',
                variant: 'destructive'
            })
        }
    }

    // Update cart badge count
    const cartItemsCount = cartItems.length

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-muted-foreground text-base md:text-lg">Loading products...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 flex items-center justify-center">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle className="text-red-600 text-lg md:text-xl">Error</CardTitle>
                        <CardDescription className="text-base md:text-lg">{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button 
                            onClick={() => window.location.reload()} 
                            variant="outline"
                            className="w-full py-3 text-base"
                        >
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header with user info and logout */}
            <div className="bg-white shadow-sm sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 flex justify-between items-center">
                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden mr-4 text-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={() => setMobileSidebarOpen(true)}
                        aria-label="Open filters"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <div>
                        <h1 className="text-lg md:text-xl font-semibold">Welcome, {user?.name}</h1>
                        <p className="text-xs md:text-sm text-gray-600">{user?.email}</p>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                        <Button
                            variant="outline"
                            className="relative flex items-center gap-2 px-2 md:px-4 py-2 md:py-2 text-sm md:text-base"
                            onClick={() => router.push('/cart')}
                            aria-label="View cart"
                        >
                            <ShoppingCart className="h-5 w-5" />
                            {cartItems.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {cartItems.length}
                                </span>
                            )}
                            <span className="sr-only">Cart</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex items-center gap-2 px-2 md:px-4 py-2 md:py-2 text-sm md:text-base"
                            onClick={() => router.push('/transactions')}
                        >
                            <DollarSign className="h-4 w-4" />
                            <span className="hidden sm:inline">Transactions</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex items-center gap-2 px-2 md:px-4 py-2 md:py-2 text-sm md:text-base"
                            onClick={() => router.push('/my-orders')}
                        >
                            <Package className="h-4 w-4" />
                            <span className="hidden sm:inline">My Orders</span>
                        </Button>
                        <Button 
                            onClick={handleLogout}
                            variant="outline"
                            className="flex items-center gap-2 px-2 md:px-4 py-2 md:py-2 text-sm md:text-base"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile sidebar overlay */}
            {mobileSidebarOpen && (
                <div className="fixed inset-0 z-40 flex md:hidden">
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 bg-black/50"
                        onClick={() => setMobileSidebarOpen(false)}
                        aria-label="Close filters"
                    />
                    {/* Sidebar drawer */}
                    <div className="relative ml-auto w-4/5 max-w-xs bg-white shadow-lg p-4 space-y-6 overflow-y-auto z-50 h-full">
                        <button
                            className="absolute top-4 right-4 text-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={() => setMobileSidebarOpen(false)}
                            aria-label="Close filters"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        {/* Sidebar content duplicated */}
                        {/* Price Range Inputs */}
                        <div>
                            <h2 className="text-base font-semibold mb-4">Price Range</h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="m-min-price">Min Price</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                            <Input
                                                id="m-min-price"
                                                type="text"
                                                value={inputPriceRange.min}
                                                onChange={(e) => handlePriceInputChange('min', e.target.value)}
                                                className="pl-8 py-2 text-sm"
                                                placeholder="Min"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="m-max-price">Max Price</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                            <Input
                                                id="m-max-price"
                                                type="text"
                                                value={inputPriceRange.max}
                                                onChange={(e) => handlePriceInputChange('max', e.target.value)}
                                                className="pl-8 py-2 text-sm"
                                                placeholder="Max"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* Active range display */}
                                <div className="bg-blue-50 p-2 rounded-lg">
                                    <p className="text-xs text-center text-blue-600">
                                        Showing products from {formatPrice(priceRange[0])} to {formatPrice(priceRange[1])}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Sort Options */}
                        <div>
                            <h2 className="text-base font-semibold mb-4">Sort By</h2>
                            <div className="space-y-2">
                                <Button 
                                    variant={sortBy === 'price-high' ? 'default' : 'outline'} 
                                    className="w-full justify-start py-2 text-sm"
                                    onClick={() => setSortBy('price-high')}
                                >
                                    <ArrowUpDown className="mr-2 h-4 w-4" />
                                    Price: High to Low
                                </Button>
                                <Button 
                                    variant={sortBy === 'price-low' ? 'default' : 'outline'} 
                                    className="w-full justify-start py-2 text-sm"
                                    onClick={() => setSortBy('price-low')}
                                >
                                    <ArrowUpDown className="mr-2 h-4 w-4" />
                                    Price: Low to High
                                </Button>
                                <Button 
                                    variant={sortBy === 'latest' ? 'default' : 'outline'} 
                                    className="w-full justify-start py-2 text-sm"
                                    onClick={() => setSortBy('latest')}
                                >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Latest First
                                </Button>
                            </div>
                        </div>

                        {/* Categories */}
                        <div>
                            <h2 className="text-base font-semibold mb-4">Categories</h2>
                            <div className="space-y-2">
                                <Button 
                                    variant={selectedCategory === null ? 'default' : 'outline'} 
                                    className="w-full justify-start py-2 text-sm"
                                    onClick={() => setSelectedCategory(null)}
                                >
                                    <Tag className="mr-2 h-4 w-4" />
                                    All Categories
                                </Button>
                                {categories.map((category) => (
                                    <Button 
                                        key={category.id}
                                        variant={selectedCategory === category.id ? 'default' : 'outline'} 
                                        className="w-full justify-start py-2 text-sm"
                                        onClick={() => setSelectedCategory(category.id)}
                                    >
                                        <Tag className="mr-2 h-4 w-4" />
                                        {category.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row">
                {/* Sidebar (desktop) */}
                <div className="hidden md:block w-64 min-h-screen bg-white shadow-lg p-6 space-y-6">
                    {/* Price Range Inputs */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Price Range</h2>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="min-price">Min Price</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                        <Input
                                            id="min-price"
                                            type="text"
                                            value={inputPriceRange.min}
                                            onChange={(e) => handlePriceInputChange('min', e.target.value)}
                                            className="pl-8"
                                            placeholder="Min"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="max-price">Max Price</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                        <Input
                                            id="max-price"
                                            type="text"
                                            value={inputPriceRange.max}
                                            onChange={(e) => handlePriceInputChange('max', e.target.value)}
                                            className="pl-8"
                                            placeholder="Max"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Active range display */}
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-sm text-center text-blue-600">
                                    Showing products from {formatPrice(priceRange[0])} to {formatPrice(priceRange[1])}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold mb-4">Sort By</h2>
                        <div className="space-y-2">
                            <Button 
                                variant={sortBy === 'price-high' ? 'default' : 'outline'} 
                                className="w-full justify-start"
                                onClick={() => setSortBy('price-high')}
                            >
                                <ArrowUpDown className="mr-2 h-4 w-4" />
                                Price: High to Low
                            </Button>
                            <Button 
                                variant={sortBy === 'price-low' ? 'default' : 'outline'} 
                                className="w-full justify-start"
                                onClick={() => setSortBy('price-low')}
                            >
                                <ArrowUpDown className="mr-2 h-4 w-4" />
                                Price: Low to High
                            </Button>
                            <Button 
                                variant={sortBy === 'latest' ? 'default' : 'outline'} 
                                className="w-full justify-start"
                                onClick={() => setSortBy('latest')}
                            >
                                <Calendar className="mr-2 h-4 w-4" />
                                Latest First
                            </Button>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold mb-4">Categories</h2>
                        <div className="space-y-2">
                            <Button 
                                variant={selectedCategory === null ? 'default' : 'outline'} 
                                className="w-full justify-start"
                                onClick={() => setSelectedCategory(null)}
                            >
                                <Tag className="mr-2 h-4 w-4" />
                                All Categories
                            </Button>
                            {categories.map((category) => (
                                <Button 
                                    key={category.id}
                                    variant={selectedCategory === category.id ? 'default' : 'outline'} 
                                    className="w-full justify-start"
                                    onClick={() => setSelectedCategory(category.id)}
                                >
                                    <Tag className="mr-2 h-4 w-4" />
                                    {category.name}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-2 sm:p-4 md:p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="mb-6 md:mb-8">
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Our Products
                            </h1>
                            <p className="text-gray-600 text-sm md:text-base">
                                {selectedCategory 
                                    ? `Showing ${categories.find(c => c.id === selectedCategory)?.name} products`
                                    : 'Discover our amazing collection of products.'
                                }
                            </p>
                        </div>

                        {filteredProducts.length === 0 ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>No Products Available</CardTitle>
                                    <CardDescription>
                                        {selectedCategory 
                                            ? "No products found in this category."
                                            : "Check back later for our latest products."
                                        }
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                {filteredProducts.map((product) => (
                                    <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                                        <div className="relative h-40 sm:h-48 w-full bg-gray-100">
                                            {product.imageUrl ? (
                                                <Image
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover object-center"
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs sm:text-base">
                                                    No image available
                                                </div>
                                            )}
                                        </div>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="line-clamp-1 text-base md:text-lg">{product.name}</CardTitle>
                                                    <CardDescription className="line-clamp-1 text-xs md:text-sm">
                                                        {product.category.name}
                                                    </CardDescription>
                                                </div>
                                                <div className="text-base md:text-lg font-bold text-blue-600">
                                                    {formatPrice(product.price)}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-xs md:text-sm text-gray-600 line-clamp-2 mb-2 md:mb-4">
                                                {product.description}
                                            </p>
                                            <Button 
                                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-2 text-sm md:text-base"
                                                onClick={() => handleAddToCart(product)}
                                            >
                                                <ShoppingCart className="mr-2 h-4 w-4" />
                                                Add to Cart
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}