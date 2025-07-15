import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
    try {
        const categories = await db.category.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        })
        return NextResponse.json(categories)
    } catch (error) {
        console.error("[CATEGORIES_GET]", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name } = body

        if (!name) {
            return NextResponse.json(
                { error: "Category name is required" },
                { status: 400 }
            )
        }

        // Check if category already exists
        const existingCategory = await db.category.findUnique({
            where: { name }
        })

        if (existingCategory) {
            return NextResponse.json(
                { error: "Category already exists" },
                { status: 400 }
            )
        }

        // Create new category
        const category = await db.category.create({
            data: { name }
        })

        return NextResponse.json(category)
    } catch (error) {
        console.error("[CATEGORIES_POST]", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json()
        const { id, name } = body

        if (!id || !name) {
            return NextResponse.json(
                { error: "Category ID and name are required" },
                { status: 400 }
            )
        }

        // Check if new name already exists for a different category
        const existingCategory = await db.category.findFirst({
            where: {
                name,
                NOT: {
                    id
                }
            }
        })

        if (existingCategory) {
            return NextResponse.json(
                { error: "Category name already exists" },
                { status: 400 }
            )
        }

        // Update category
        const updatedCategory = await db.category.update({
            where: { id },
            data: { name }
        })

        return NextResponse.json(updatedCategory)
    } catch (error) {
        console.error("[CATEGORIES_PUT]", error)
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
                { error: "Category ID is required" },
                { status: 400 }
            )
        }

        // Delete category
        await db.category.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[CATEGORIES_DELETE]", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
} 