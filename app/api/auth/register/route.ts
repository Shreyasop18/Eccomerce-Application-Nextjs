import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { registerSchema } from "@/lib/validations/auth"
import { createUser, findUserByEmail } from "@/lib/auth"
import { createVerificationToken } from "@/lib/auth"
import { sendEmail, generateVerificationEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log("Received registration attempt")
    
    // Validate the request body
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      console.log("Validation failed:", result.error.issues)
      return NextResponse.json(
        { error: "Validation failed", details: result.error.issues },
        { status: 400 }
      )
    }

    const { name, email, password, confirmPassword } = result.data

    // Check if user already exists
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Hash the password with bcrypt (12 salt rounds as per requirements)
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const { id, user } = await createUser({
      name,
      email,
      password: hashedPassword
    })

    // Generate verification token
    const verificationToken = await createVerificationToken(email)

    // Send verification email
    const emailData = generateVerificationEmail(name, email, verificationToken)
    const emailResult = await sendEmail(emailData)

    if (!emailResult.success) {
      console.error("Failed to send verification email for user:", { id })
      // In production, you might want to handle this differently
      // For now, we'll still create the user but log the error
    }

    console.log("Registration successful:", {
      id,
      emailSent: emailResult.success
    })

    return NextResponse.json(
      { 
        message: "Registration successful! Please check your email to verify your account before logging in.",
        user: { name, email },
        emailSent: emailResult.success
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 