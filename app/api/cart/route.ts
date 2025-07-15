import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { Decimal } from "@prisma/client/runtime/library"

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function getUserId(request: NextRequest): Promise<string | null> {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
        return null
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET) as { userId: string }
        return payload.userId
    } catch {
        return null
    }
}

// Generate a cart number
function generateCartNumber(): string {
    return `CART-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
}

// Get or create cart number for user
async function getOrCreateCartNumber(userId: string): Promise<string> {
    // Find the most recent cart for this user
    const latestCart = await prisma.tempCart.findFirst({
        where: { userId },
        orderBy: { cartDate: 'desc' }
    })

    if (latestCart) {
        return latestCart.cartNumber
    }

    // If no cart exists, generate a new cart number
    return generateCartNumber()
}

// Get cart items
export async function GET(request: NextRequest) {
    try {
        const userId = await getUserId(request)
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const cartItems = await prisma.tempCart.findMany({
            where: {
                userId
            },
            include: {
                product: {
                    include: {
                        category: true
                    }
                }
            }
        })

        return NextResponse.json(cartItems)
    } catch (error) {
        console.error("[CART_GET]", error)
        return new NextResponse("Internal error", { status: 500 })
    }
}

// Add or update cart item
export async function POST(request: NextRequest) {
    try {
        const userId = await getUserId(request)
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await request.json()
        const { productId, quantity } = body

        if (!productId || typeof quantity !== 'number' || quantity < 1) {
            return new NextResponse("Invalid input", { status: 400 })
        }

        // Get product price
        const product = await prisma.product.findUnique({
            where: { id: productId }
        })

        if (!product) {
            return new NextResponse("Product not found", { status: 404 })
        }

        // Get or create cart number
        const cartNumber = await getOrCreateCartNumber(userId)

        // Check if item already exists in cart
        const existingItem = await prisma.tempCart.findFirst({
            where: {
                userId,
                productId
            }
        })

        if (existingItem) {
            // Update existing item
            const itemTotal = new Decimal(product.price).mul(quantity)
            const updated = await prisma.tempCart.update({
                where: { id: existingItem.id },
                data: {
                    quantity,
                    itemTotal
                },
                include: {
                    product: {
                        include: {
                            category: true
                        }
                    }
                }
            })
            return NextResponse.json(updated)
        }

        // Create new cart item with existing cart number
        const itemTotal = new Decimal(product.price).mul(quantity)
        const cartItem = await prisma.tempCart.create({
            data: {
                userId,
                productId,
                quantity,
                price: product.price,
                itemTotal,
                cartNumber,
                cartDate: new Date()
            },
            include: {
                product: {
                    include: {
                        category: true
                    }
                }
            }
        })

        return NextResponse.json(cartItem)
    } catch (error) {
        console.error("[CART_POST]", error)
        return new NextResponse("Internal error", { status: 500 })
    }
}

// Delete cart item
export async function DELETE(request: NextRequest) {
    try {
        const userId = await getUserId(request)
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const productId = searchParams.get("productId")

        if (!productId) {
            return new NextResponse("Product ID required", { status: 400 })
        }

        await prisma.tempCart.deleteMany({
            where: {
                userId,
                productId
            }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[CART_DELETE]", error)
        return new NextResponse("Internal error", { status: 500 })
    }
} 