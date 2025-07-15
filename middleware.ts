import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { join } from 'path'

export function middleware(request: NextRequest) {
  // Only handle /uploads/* requests
  if (!request.nextUrl.pathname.startsWith('/uploads/')) {
    return NextResponse.next()
  }

  // Get the file path from the URL
  const filePath = request.nextUrl.pathname.replace('/uploads/', '')
  
  // Create a new response that serves the file from the public directory
  const response = NextResponse.next()
  
  // Add cache headers
  response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  
  return response
}

export const config = {
  matcher: '/uploads/:path*',
} 