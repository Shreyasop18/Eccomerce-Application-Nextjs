import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    // Simple test query first
    const testResult = await prisma.$queryRaw`SELECT 1 as test`
    console.log('Basic connection test:', testResult)

    // If basic test passes, try table operations
    const userCount = await prisma.user.count()
    console.log('User count:', userCount)

    return NextResponse.json({
      status: "success",
      message: "Database connection successful!",
      testQuery: testResult,
      userCount: userCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Database connection error:", error)
    
    // Check if it's a Prisma initialization error
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const isPrismaError = errorMessage.includes("prisma")
    
    return NextResponse.json(
      {
        status: "error",
        message: isPrismaError 
          ? "Database client initialization failed. Please check your database connection."
          : "Database connection failed",
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 