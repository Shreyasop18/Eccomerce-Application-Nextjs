import { NextRequest, NextResponse } from "next/server"
import { verifyToken, removeVerificationToken, findUserByEmail, updateUserVerification } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      )
    }

    // Verify the token
    const tokenResult = await verifyToken(token)
    
    if (!tokenResult.valid) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await findUserByEmail(tokenResult.email!)
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Update user verification status
    const updated = await updateUserVerification(user.id)
    if (!updated) {
      return NextResponse.json(
        { error: "Failed to verify user" },
        { status: 500 }
      )
    }

    // Remove the used token
    await removeVerificationToken(token)

    console.log("Email verification successful:", { id: user.id })

    return NextResponse.json(
      { 
        message: "Email verified successfully! You can now log in to your account.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 