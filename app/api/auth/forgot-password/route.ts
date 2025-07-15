import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { sendEmail, generatePasswordResetEmail } from '@/lib/email'
import { forgotPasswordSchema } from '@/lib/validations/auth'
import crypto from 'crypto'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const { email } = forgotPasswordSchema.parse(body)
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      // Show validation message for non-existent email
      return NextResponse.json(
        { error: 'No account found with this email address. Please check your email or register a new account.' },
        { status: 404 }
      )
    }
    
    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    
    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email }
    })
    
    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        token,
        email,
        expiresAt
      }
    })
    
    // Send password reset email
    const emailData = generatePasswordResetEmail(email, token)
    const emailResult = await sendEmail(emailData)
    
    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error)
      return NextResponse.json(
        { error: 'Failed to send password reset email. Please try again later.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { message: 'Password reset link has been sent to your email address.' },
      { status: 200 }
    )
    
  } catch (error) {
    console.error('Forgot password error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    )
  }
} 