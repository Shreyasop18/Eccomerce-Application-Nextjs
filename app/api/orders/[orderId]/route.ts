import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const userEmail = request.headers.get('user-email')
    if (!userEmail) {
      console.log('No user email provided')
      return NextResponse.json({ error: "Unauthorized - Email required" }, { status: 401 })
    }

    const user = await findUserByEmail(userEmail)
    if (!user) {
      console.log('User not found:', userEmail)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log('Fetching order:', params.orderId, 'for user:', user.id)
    const order = await db.order.findFirst({
      where: {
        id: params.orderId,
        userId: user.id // Ensure user can only access their own orders
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                imageUrl: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      console.log('Order not found:', params.orderId)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    console.log('Order found:', order.id)
    return NextResponse.json(order)
  } catch (error) {
    console.error('[ORDER_GET]', error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const { status } = await request.json();
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }
    const updated = await db.order.update({
      where: { id: params.orderId },
      data: { status },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[ORDER_PATCH]', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
} 