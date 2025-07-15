import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"
import { findUserByEmail } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentIntentId: string } }
) {
  try {
    const userEmail = request.headers.get('user-email')
    
    if (!userEmail) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await findUserByEmail(userEmail)
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const order = await prisma.order.findFirst({
      where: {
        paymentIntentId: params.paymentIntentId,
        userId: user.id
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                description: true,
                imageUrl: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return new NextResponse("Order not found", { status: 404 })
    }

    // Transform the data to match the frontend expectations
    const transformedOrder = {
      ...order,
      items: order.orderItems,
      shippingAddress: order.shippingAddress as {
        fullName: string
        addressLine1: string
        addressLine2?: string
        city: string
        state: string
        postalCode: string
        phone: string
      }
    }

    return NextResponse.json(transformedOrder)
  } catch (error) {
    console.error("[ORDERS_BY_PAYMENT_INTENT_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 