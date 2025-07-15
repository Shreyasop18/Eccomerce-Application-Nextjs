"use client"

import { useEffect, useState } from "react"

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

const formatPrice = (price: number | string): string => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price
    return !isNaN(numericPrice) ? numericPrice.toFixed(2) : '0.00'
}

export default function Products() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Fetch products
    const fetchProducts = async () => {
        try {
            const response = await fetch("/api/admin/products")
            const data = await response.json()
            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch products")
            }
            setProducts(data)
        } catch (error) {
            console.error("Error fetching products:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) {
            return
        }

        setDeletingId(id)
        try {
            const response = await fetch(`/api/admin/products?id=${id}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to delete product")
            }

            // Remove product from state
            setProducts(prev => prev.filter(product => product.id !== id))
        } catch (error) {
            console.error("Error deleting product:", error)
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Products</h2>
                    <p className="text-gray-600">
                        Manage your product listings here.
                    </p>
                </div>
                <a href="/admin/dashboard/addproducts">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                        Add Product
                    </button>
                </a>
            </div>

            <div className="bg-white rounded-lg border">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold">Product List</h3>
                </div>
                <div className="p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-6">
                            <div className="text-gray-500">Loading products...</div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                            <p className="text-gray-500">
                                No products found. Add your first product to get started.
                            </p>
                            <a href="/admin/dashboard/addproducts" className="mt-4">
                                <button className="border border-gray-300 px-4 py-2 rounded">
                                    Add Product
                                </button>
                            </a>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-3 font-medium">Name</th>
                                        <th className="p-3 font-medium">Category</th>
                                        <th className="p-3 font-medium">Price</th>
                                        <th className="p-3 font-medium">Description</th>
                                        <th className="p-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {products.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="p-3 font-medium">{product.name}</td>
                                            <td className="p-3">{product.category.name}</td>
                                            <td className="p-3">${formatPrice(product.price)}</td>
                                            <td className="p-3">
                                                <div className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                                                    {product.description}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <a href={`/admin/dashboard/products/edit/${product.id}`}>
                                                        <button className="text-blue-600 hover:text-blue-700 px-2 py-1">
                                                            Edit
                                                        </button>
                                                    </a>
                                                    <button
                                                        className="text-red-600 hover:text-red-700 px-2 py-1"
                                                        onClick={() => handleDelete(product.id)}
                                                        disabled={deletingId === product.id}
                                                    >
                                                        {deletingId === product.id ? "Deleting..." : "Delete"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}