"use client"

import { useEffect, useState } from "react"

interface Category {
    id: string
    name: string
    createdAt: string
    updatedAt: string
}

export default function AddCategory() {
    const [loading, setLoading] = useState(false)
    const [categoryName, setCategoryName] = useState("")
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)

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
                setIsLoading(false)
            }
        }

        fetchCategories()
    }, [])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        
        try {
            if (editingCategory) {
                // Update existing category
                const response = await fetch("/api/admin/categories", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ 
                        id: editingCategory.id,
                        name: categoryName 
                    }),
                })

                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || "Failed to update category")
                }

                // Update the category in the list
                setCategories(prev => prev.map(cat => 
                    cat.id === editingCategory.id ? data : cat
                ))

                setEditingCategory(null)
            } else {
                // Add new category
                const response = await fetch("/api/admin/categories", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ name: categoryName }),
                })

                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || "Failed to add category")
                }

                // Add the new category to the list
                setCategories(prev => [data, ...prev])
            }
            setCategoryName("") // Clear the input after successful submission
        } catch (error) {
            console.error("Error with category:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this category?")) {
            return
        }

        try {
            const response = await fetch(`/api/admin/categories?id=${id}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to delete category")
            }

            // Remove the category from the list
            setCategories(prev => prev.filter(cat => cat.id !== id))
        } catch (error) {
            console.error("Error deleting category:", error)
        }
    }

    const startEditing = (category: Category) => {
        setEditingCategory(category)
        setCategoryName(category.name)
    }

    const cancelEditing = () => {
        setEditingCategory(null)
        setCategoryName("")
    }

    return (
        <div className="space-y-6 w-full px-1 sm:px-4 md:px-8 max-w-full md:max-w-3xl md:mx-auto">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Categories</h2>
                <p className="text-gray-600 text-sm sm:text-base">
                    Manage your product categories.
                </p>
            </div>

            <div className="bg-white rounded-lg border">
                <div className="p-3 sm:p-4 border-b">
                    <h3 className="text-base sm:text-lg font-semibold">
                        {editingCategory ? "Edit Category" : "Add New Category"}
                    </h3>
                </div>
                <div className="p-3 sm:p-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="categoryName" className="block text-xs sm:text-sm font-medium">Category Name</label>
                            <input
                                id="categoryName"
                                name="categoryName"
                                placeholder="Enter category name"
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                required
                                disabled={loading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                            <button 
                                type="submit" 
                                disabled={loading || !categoryName.trim()}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50 w-full sm:w-auto text-xs sm:text-sm min-h-[40px]"
                            >
                                {loading ? "Saving..." : (editingCategory ? "Update Category" : "Add Category")}
                            </button>
                            {editingCategory && (
                                <button
                                    type="button"
                                    onClick={cancelEditing}
                                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 w-full sm:w-auto text-xs sm:text-sm min-h-[40px]"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <div className="bg-white rounded-lg border">
                <div className="p-3 sm:p-4 border-b">
                    <h3 className="text-base sm:text-lg font-semibold">All Categories</h3>
                </div>
                <div className="p-3 sm:p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-6">
                            <div className="text-gray-500">Loading...</div>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                            No categories found. Add your first category above.
                        </div>
                    ) : (
                        <div>
                            {/* Mobile Card List */}
                            <div className="flex flex-col gap-3 sm:hidden">
                                {categories.map((category) => (
                                    <div key={category.id} className="bg-white rounded-lg border p-3 flex flex-col gap-2 shadow-sm">
                                        <div className="font-semibold text-base break-all">{category.name}</div>
                                        <div className="text-gray-500 text-xs">Created: {new Date(category.createdAt).toLocaleDateString()}</div>
                                        <div className="flex gap-2 mt-1">
                                            <button
                                                onClick={() => startEditing(category)}
                                                className="flex-1 text-blue-600 hover:text-blue-700 px-2 py-2 rounded border border-blue-100 bg-blue-50 text-xs min-h-[36px]"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id)}
                                                className="flex-1 text-red-600 hover:text-red-700 px-2 py-2 rounded border border-red-100 bg-red-50 text-xs min-h-[36px]"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Desktop Table */}
                            <div className="overflow-x-auto hidden sm:block">
                                <table className="w-full text-left text-xs sm:text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="p-2 sm:p-3 font-medium break-all">Name</th>
                                            <th className="p-2 sm:p-3 font-medium break-all">Created</th>
                                            <th className="p-2 sm:p-3 font-medium break-all">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {categories.map((category) => (
                                            <tr key={category.id} className="hover:bg-gray-50">
                                                <td className="p-2 sm:p-3 font-medium break-all">{category.name}</td>
                                                <td className="p-2 sm:p-3 text-gray-500 text-xs sm:text-sm break-all">
                                                    {new Date(category.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="p-2 sm:p-3">
                                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                                        <button
                                                            onClick={() => startEditing(category)}
                                                            className="text-blue-600 hover:text-blue-700 px-2 py-2 rounded w-full sm:w-auto text-xs sm:text-sm min-h-[36px] text-left sm:text-center"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(category.id)}
                                                            className="text-red-600 hover:text-red-700 px-2 py-2 rounded w-full sm:w-auto text-xs sm:text-sm min-h-[36px] text-left sm:text-center"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}