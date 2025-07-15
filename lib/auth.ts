import crypto from 'crypto'
import { prisma } from './prisma'

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function createVerificationToken(email: string): Promise<string> {
  const token = generateVerificationToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  
  await prisma.verificationToken.create({
    data: {
      token,
      email,
      expiresAt
    }
  })
  
  return token
}

export async function verifyToken(token: string): Promise<{ valid: boolean; email?: string }> {
  const tokenData = await prisma.verificationToken.findUnique({
    where: { token }
  })
  
  if (!tokenData) {
    return { valid: false }
  }
  
  if (new Date() > tokenData.expiresAt) {
    await prisma.verificationToken.delete({
      where: { token }
    })
    return { valid: false }
  }
  
  return { valid: true, email: tokenData.email }
}

export async function removeVerificationToken(token: string): Promise<void> {
  await prisma.verificationToken.delete({
    where: { token }
  })
}

export async function createUser(userData: {
  name: string
  email: string
  password: string
}): Promise<{ id: string; user: any }> {
  const user = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      emailVerified: false
    }
  })
  
  return { id: user.id, user }
}

export async function findUserByEmail(email: string): Promise<any | null> {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true
    }
  })
}

export async function findUserById(id: string): Promise<any | null> {
  return prisma.user.findUnique({
    where: { id }
  })
}

export async function updateUserVerification(id: string): Promise<boolean> {
  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { emailVerified: true }
    })
    console.log('User verification updated:', { id, emailVerified: updatedUser.emailVerified })
    return true
  } catch (error) {
    console.error('Failed to update user verification:', error)
    return false
  }
} 