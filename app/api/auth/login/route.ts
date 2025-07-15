import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { loginSchema } from "@/lib/validations/auth"
import { findUserByEmail } from "@/lib/auth"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key' // Use environment variable in production

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log without sensitive data
    console.log("Received login attempt")
    
    // Validate the request body
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      console.log("Login validation failed:", result.error.issues)
      return NextResponse.json(
        { error: "Validation failed", details: result.error.issues },
        { status: 400 }
      )
    }

    const { email, password } = result.data

    // Find user by email
    const user = await findUserByEmail(email)
    if (user) {
      console.log("User found:", { id: user.id }) // Only log non-sensitive data
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Debug log for verification status
    console.log("User verification status:", {
      id: user.id,
      emailVerified: user.emailVerified
    })

    // Check if email is verified
    if (user.emailVerified !== true) {
      console.log("Email not verified for user:", {
        id: user.id,
        emailVerified: user.emailVerified
      })
      return NextResponse.json(
        { error: "Please verify your email address before logging in" },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    console.log("Login successful:", { id: user.id })

    // Create the response
    const response = NextResponse.json(
      { 
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      },
      { status: 200 }
    )

    // Set auth token cookie
    response.cookies.set(
      'auth-token',
      token,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 // 24 hours
      }
    )

    return response

  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 