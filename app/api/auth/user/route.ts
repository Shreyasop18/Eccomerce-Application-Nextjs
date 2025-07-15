import { NextRequest, NextResponse } from "next/server"
import { findUserById } from "@/lib/auth"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify JWT token
    let payload: any
    try {
      payload = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      )
    }

    const userId = payload.userId as string

    // Get user data
    const user = await findUserById(userId)
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Return user data without sensitive information
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })

  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 