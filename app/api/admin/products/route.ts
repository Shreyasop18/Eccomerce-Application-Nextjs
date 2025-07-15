import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        // If ID is provided, fetch single product
        if (id) {
            const product = await db.product.findUnique({
                where: { id },
                include: {
                    category: true
                }
            })

            if (!product) {
                return NextResponse.json(
                    { error: "Product not found" },
                    { status: 404 }
                )
            }

            return NextResponse.json({
                ...product,
                price: Number(product.price)
            })
        }

        // Otherwise, fetch all products
        const products = await db.product.findMany({
            include: {
                category: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Convert Decimal price to number for each product
        const formattedProducts = products.map(product => ({
            ...product,
            price: Number(product.price)
        }))

        return NextResponse.json(formattedProducts)
    } catch (error) {
        console.error("[PRODUCTS_GET]", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, description, price, categoryId, imageUrl } = body

        // Validate required fields
        if (!name || !description || !price || !categoryId) {
            return NextResponse.json(
                { error: "Name, description, price, and category are required" },
                { status: 400 }
            )
        }

        // Validate price is a positive number
        const numericPrice = parseFloat(price)
        if (isNaN(numericPrice) || numericPrice <= 0) {
            return NextResponse.json(
                { error: "Price must be a positive number" },
                { status: 400 }
            )
        }

        // Check if category exists
        const category = await db.category.findUnique({
            where: { id: categoryId }
        })

        if (!category) {
            return NextResponse.json(
                { error: "Selected category does not exist" },
                { status: 400 }
            )
        }

        // Create new product
        const product = await db.product.create({
            data: {
                name,
                description,
                price: numericPrice,
                categoryId,
                imageUrl: imageUrl || null // Make imageUrl optional
            },
            include: {
                category: true // Include category details in response
            }
        })

        // Convert Decimal price to number before sending response
        return NextResponse.json({
            ...product,
            price: Number(product.price)
        })
    } catch (error) {
        console.error("[PRODUCTS_POST]", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json()
        const { id, name, description, price, categoryId, imageUrl } = body

        if (!id) {
            return NextResponse.json(
                { error: "Product ID is required" },
                { status: 400 }
            )
        }

        // Validate required fields
        if (!name || !description || !price || !categoryId) {
            return NextResponse.json(
                { error: "Name, description, price, and category are required" },
                { status: 400 }
            )
        }

        // Validate price is a positive number
        const numericPrice = parseFloat(price)
        if (isNaN(numericPrice) || numericPrice <= 0) {
            return NextResponse.json(
                { error: "Price must be a positive number" },
                { status: 400 }
            )
        }

        // Check if category exists
        const category = await db.category.findUnique({
            where: { id: categoryId }
        })

        if (!category) {
            return NextResponse.json(
                { error: "Selected category does not exist" },
                { status: 400 }
            )
        }

        // Update product
        const product = await db.product.update({
            where: { id },
            data: {
                name,
                description,
                price: numericPrice,
                categoryId,
                imageUrl: imageUrl || null
            },
            include: {
                category: true
            }
        })

        // Convert Decimal price to number before sending response
        return NextResponse.json({
            ...product,
            price: Number(product.price)
        })
    } catch (error) {
        console.error("[PRODUCTS_PUT]", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: "Product ID is required" },
                { status: 400 }
            )
        }

        // Delete product
        await db.product.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[PRODUCTS_DELETE]", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
} 