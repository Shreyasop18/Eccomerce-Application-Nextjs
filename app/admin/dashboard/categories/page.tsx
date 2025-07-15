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
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
                <p className="text-gray-600">
                    Manage your product categories.
                </p>
            </div>

            <div className="bg-white rounded-lg border">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold">
                        {editingCategory ? "Edit Category" : "Add New Category"}
                    </h3>
                </div>
                <div className="p-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="categoryName" className="block text-sm font-medium">Category Name</label>
                            <input
                                id="categoryName"
                                name="categoryName"
                                placeholder="Enter category name"
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                required
                                disabled={loading}
                                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <button 
                                type="submit" 
                                disabled={loading || !categoryName.trim()}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
                            >
                                {loading ? "Saving..." : (editingCategory ? "Update Category" : "Add Category")}
                            </button>
                            {editingCategory && (
                                <button
                                    type="button"
                                    onClick={cancelEditing}
                                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <div className="bg-white rounded-lg border">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold">All Categories</h3>
                </div>
                <div className="p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-6">
                            <div className="text-gray-500">Loading...</div>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                            No categories found. Add your first category above.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-3 font-medium">Name</th>
                                        <th className="p-3 font-medium">Created</th>
                                        <th className="p-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {categories.map((category) => (
                                        <tr key={category.id} className="hover:bg-gray-50">
                                            <td className="p-3 font-medium">{category.name}</td>
                                            <td className="p-3 text-gray-500 text-sm">
                                                {new Date(category.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => startEditing(category)}
                                                        className="text-blue-600 hover:text-blue-700 px-2 py-1"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(category.id)}
                                                        className="text-red-600 hover:text-red-700 px-2 py-1"
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
                    )}
                </div>
            </div>
        </div>
    )
}