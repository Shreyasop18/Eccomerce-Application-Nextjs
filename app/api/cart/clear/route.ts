import { NextResponse } from 'next/server'
import { findUserByEmail } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const userEmail = req.headers.get('user-email')
    if (!userEmail) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await findUserByEmail(userEmail)

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    // Delete all cart items for the user
    await db.tempCart.deleteMany({
      where: { userId: user.id }
    })

    return new NextResponse("Cart cleared", { status: 200 })
  } catch (error) {
    console.error('[CART_CLEAR]', error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 