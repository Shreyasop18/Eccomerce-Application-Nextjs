"use client"

import { useEffect, useState } from "react"

interface Category {
    id: string
    name: string
}

interface FormData {
    name: string
    description: string
    price: string
    categoryId: string
    imageUrl?: string
}

export default function AddProducts() {
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoadingCategories, setIsLoadingCategories] = useState(true)
    const [uploadingImage, setUploadingImage] = useState(false)
    const [formData, setFormData] = useState<FormData>({
        name: "",
        description: "",
        price: "",
        categoryId: "",
        imageUrl: ""
    })

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch("/api/admin/categories")
                const data = await response.json()
                if (!response.ok) {
                    throw new Error(data.error || "Failed to fetch categories")
                }
                setCategories(data)
            } catch (error) {
                console.error("Error fetching categories:", error)
            } finally {
                setIsLoadingCategories(false)
            }
        }

        fetchCategories()
    }, [])

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingImage(true)
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
        } catch (error) {
            console.error("Error uploading image:", error)
        } finally {
            setUploadingImage(false)
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
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to add product")
            }

            // Reset form
            setFormData({
                name: "",
                description: "",
                price: "",
                categoryId: "",
                imageUrl: ""
            })
        } catch (error) {
            console.error("Error adding product:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Add New Product</h2>
                <p className="text-gray-600">
                    Create a new product by filling out the form below.
                </p>
            </div>

            <div className="bg-white rounded-lg border">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold">Product Information</h3>
                </div>
                <div className="p-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label htmlFor="name" className="block text-sm font-medium">Product Name</label>
                                <input
                                    id="name"
                                    name="name"
                                    placeholder="Enter product name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="price" className="block text-sm font-medium">Price</label>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="categoryId" className="block text-sm font-medium">Category</label>
                            <select
                                id="categoryId"
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleChange}
                                required
                                disabled={loading || isLoadingCategories}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="">Select a category</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className="block text-sm font-medium">Description</label>
                            <textarea
                                id="description"
                                name="description"
                                placeholder="Enter product description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="image" className="block text-sm font-medium">Product Image</label>
                            <input
                                id="image"
                                name="image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={uploadingImage}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                            {uploadingImage && <div className="text-sm text-gray-500">Uploading...</div>}
                            {formData.imageUrl && (
                                <div className="text-sm text-green-600">Image uploaded successfully</div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:opacity-50"
                        >
                            {loading ? "Adding Product..." : "Add Product"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}