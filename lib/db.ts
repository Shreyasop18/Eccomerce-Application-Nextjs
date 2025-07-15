import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as { prisma?: PrismaClient }

export const db = globalForPrisma.prisma || new PrismaClient()
export const prisma = db

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db 