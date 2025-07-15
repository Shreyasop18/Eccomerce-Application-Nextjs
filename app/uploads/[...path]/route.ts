import { NextResponse } from 'next/server'
import { join } from 'path'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    // Construct the file path
    const filePath = join(process.cwd(), 'public', 'uploads', ...params.path)
    
    // Check if file exists
    if (!existsSync(filePath)) {
      console.error(`[UPLOADS] File not found: ${filePath}`)
      return new NextResponse('File not found', { status: 404 })
    }

    // Read the file
    const file = await readFile(filePath)
    
    // Determine content type based on file extension
    const ext = filePath.split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg'
        break
      case 'png':
        contentType = 'image/png'
        break
      case 'webp':
        contentType = 'image/webp'
        break
    }

    // Return the file with appropriate headers
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('[UPLOADS] Error serving file:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 