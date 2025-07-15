import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { resetPasswordSchema } from '@/lib/validations/auth'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const { token, password } = z.object({
      token: z.string(),
      password: z.string().min(8, "Password must be at least 8 characters")
    }).parse(body)
    
    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    })
    
    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }
    
    // Check if token has expired
    if (resetToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id }
      })
      
      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new password reset.' },
        { status: 400 }
      )
    }
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Update user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })
    
    // Delete the used reset token
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id }
    })
    
    return NextResponse.json(
      { message: 'Password has been reset successfully' },
      { status: 200 }
    )
    
  } catch (error) {
    console.error('Reset password error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    )
  }
} 