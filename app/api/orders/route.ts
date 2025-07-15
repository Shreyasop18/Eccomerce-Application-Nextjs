import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"
import { findUserByEmail } from "@/lib/auth"
import nodemailer from 'nodemailer'

interface CartItem {
  productId: string
  quantity: number
  price: number
  itemTotal: number
}

interface ShippingAddress {
  fullName: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  phone: string
}

export async function POST(request: NextRequest) {
  try {
    // Get user from request cookies/headers
    const userEmail = request.headers.get('user-email')
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized - Email required" }, { status: 401 })
    }

    const user = await findUserByEmail(userEmail)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    // Validate request body
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Invalid items" }, { status: 400 })
    }

    if (!body.shippingAddress || !body.shippingAddress.fullName || !body.shippingAddress.addressLine1) {
      return NextResponse.json({ error: "Invalid shipping address" }, { status: 400 })
    }

    const { items, shippingAddress, paymentIntentId, status, paymentStatus }: { 
      items: CartItem[], 
      shippingAddress: ShippingAddress, 
      paymentIntentId?: string,
      status?: string,
      paymentStatus?: string 
    } = body

    try {
      // Check if order with this payment intent already exists
      if (paymentIntentId) {
        const existingOrder = await prisma.order.findUnique({
          where: { paymentIntentId },
          include: {
            orderItems: {
              include: {
                product: true
              }
            }
          }
        })
        
        if (existingOrder) {
          console.log('Order already exists for payment intent:', paymentIntentId)
          return NextResponse.json(existingOrder)
        }
      }

      // Create the order using Prisma transaction
      const order = await prisma.$transaction(async (prisma) => {
        const newOrder = await prisma.order.create({
          data: {
            userId: user.id,
            status: status || 'RECEIVED',
            shippingAddress: shippingAddress as any,
            total: items.reduce((sum, item) => sum + Number(item.itemTotal), 0),
            paymentIntentId: paymentIntentId || null,
            paymentStatus: paymentStatus || (paymentIntentId ? 'succeeded' : null),
            orderItems: {
              create: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                itemTotal: item.itemTotal
              }))
            }
          },
          include: {
            orderItems: {
              include: {
                product: true
              }
            }
          }
        })
        return newOrder
      })

      // Send order confirmation email via SMTP
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          secure: false, // true for 465, false for other ports
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        })

        // Ensure shippingAddress is an object and not null
        let shipping = order.shippingAddress
        if (typeof shipping === 'string') {
          try {
            shipping = JSON.parse(shipping)
          } catch {
            shipping = null
          }
        }
        // Only use as object if not an array
        let safeShipping: Partial<ShippingAddress> = {}
        if (shipping && typeof shipping === 'object' && !Array.isArray(shipping)) {
          safeShipping = shipping as Partial<ShippingAddress>
        }

        const orderItemsHtml = order.orderItems.map((item: any) =>
          `<li>${item.product.name} x ${item.quantity} - ₹${item.itemTotal}</li>`
        ).join('')

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: userEmail,
          subject: 'Your Order Confirmation',
          html: `
            <h1>Thank you for your order!</h1>
            <p>Order ID: ${order.id}</p>
            <p>Total: ₹${order.total}</p>
            <h2>Shipping Address</h2>
            <p>${safeShipping.fullName || ''}<br/>
            ${safeShipping.addressLine1 || ''}<br/>
            ${safeShipping.addressLine2 || ''}<br/>
            ${safeShipping.city || ''}, ${safeShipping.state || ''} - ${safeShipping.postalCode || ''}<br/>
            Phone: ${safeShipping.phone || ''}</p>
            <h2>Items</h2>
            <ul>${orderItemsHtml}</ul>
          `,
        }
        await transporter.sendMail(mailOptions)
      } catch (emailErr) {
        console.error('[ORDER] Failed to send order confirmation email:', emailErr)
        // Optionally, you can continue even if email fails
      }

      return NextResponse.json(order)
    } catch (dbError) {
      console.error('[ORDERS_POST_DB]', dbError)
      return NextResponse.json({ error: "Database error - Failed to create order" }, { status: 500 })
    }
  } catch (error) {
    console.error('[ORDERS_POST]', error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
    try {
        const userEmail = request.headers.get('user-email')
        
        if (!userEmail) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const user = await findUserByEmail(userEmail)
        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const orders = await prisma.order.findMany({
            where: {
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
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Transform the data to match the frontend expectations
        const transformedOrders = orders.map(order => ({
            ...order,
            items: order.orderItems,
            shippingAddress: order.shippingAddress as {
                fullName: string
                address: string
                city: string
                state: string
                postalCode: string
                country: string
            }
        }))

        return NextResponse.json(transformedOrders)
    } catch (error) {
        console.error("[ORDERS_GET]", error)
        return new NextResponse("Internal error", { status: 500 })
    }
} 