"use client"

import React, { useEffect, useState } from "react"

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
}

interface FormData {
    name: string
    description: string
    price: string
    categoryId: string
    imageUrl?: string
}

export default function EditProduct({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = React.use(params)
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [formData, setFormData] = useState<FormData>({
        name: "",
        description: "",
        price: "",
        categoryId: "",
        imageUrl: ""
    })
    const [message, setMessage] = useState("")
    const [messageType, setMessageType] = useState<"success" | "error">("success")

    // Fetch product data and categories in parallel
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productResponse, categoriesResponse] = await Promise.all([
                    fetch(`/api/admin/products?id=${resolvedParams.id}`),
                    fetch("/api/admin/categories")
                ])

                const productData = await productResponse.json()
                const categoriesData = await categoriesResponse.json()

                if (!productResponse.ok) {
                    throw new Error(productData.error || "Failed to fetch product")
                }

                if (!categoriesResponse.ok) {
                    throw new Error(categoriesData.error || "Failed to fetch categories")
                }

                setFormData({
                    name: productData.name,
                    description: productData.description,
                    price: productData.price.toString(),
                    categoryId: productData.categoryId,
                    imageUrl: productData.imageUrl || ""
                })
                setCategories(categoriesData)
            } catch (error) {
                console.error("Error fetching data:", error)
                setMessage("Failed to load product data")
                setMessageType("error")
            }
        }

        fetchData()
    }, [resolvedParams.id])

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const formData = new FormData()
        formData.append("file", file)

        try {
            const response = await fetch("/api/admin/upload", {
                method: "POST",
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to upload image")
            }

            setFormData(prev => ({
                ...prev,
                imageUrl: data.imageUrl
            }))

            setMessage("Image uploaded successfully")
            setMessageType("success")
        } catch (error) {
            console.error("Error uploading image:", error)
            setMessage(error instanceof Error ? error.message : "Failed to upload image")
            setMessageType("error")
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch("/api/admin/products", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: resolvedParams.id,
                    ...formData
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to update product")
            }

            setMessage("Product updated successfully")
            setMessageType("success")
            
            // Auto-dismiss success message after 3 seconds
            setTimeout(() => {
                window.location.href = "/admin/dashboard/products"
            }, 3000)
        } catch (error) {
            console.error("Error updating product:", error)
            setMessage(error instanceof Error ? error.message : "Failed to update product")
            setMessageType("error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Edit Product</h2>
                <p className="text-gray-600">
                    Update your product information below.
                </p>
            </div>

            {message && (
                <div className={`p-4 rounded ${messageType === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                    {message}
                </div>
            )}

            <div className="bg-white rounded-lg border">
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium mb-2">Product Name</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="Enter product name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="price" className="block text-sm font-medium mb-2">Price</label>
                                <input
                                    id="price"
                                    name="price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Enter price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="categoryId" className="block text-sm font-medium mb-2">Category</label>
                                <select
                                    id="categoryId"
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="image" className="block text-sm font-medium mb-2">Product Image</label>
                                <input
                                    id="image"
                                    name="image"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleImageUpload}
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {formData.imageUrl && (
                                    <div className="mt-2">
                                        <img
                                            src={formData.imageUrl}
                                            alt="Product preview"
                                            className="w-32 h-32 object-cover rounded border"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium mb-2">Description</label>
                            <textarea
                                id="description"
                                name="description"
                                placeholder="Enter product description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                disabled={loading}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        <div className="flex justify-end gap-4 pt-4">
                            <button 
                                type="button" 
                                onClick={() => window.location.href = "/admin/dashboard/products"}
                                disabled={loading}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? "Updating..." : "Update Product"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
} 