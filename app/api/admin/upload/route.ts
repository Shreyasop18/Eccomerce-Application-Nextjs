import { NextResponse } from "next/server"
import { writeFile, mkdir, access } from "fs/promises"
import { join } from "path"
import { constants } from "fs"

export async function POST(req: Request) {
    try {
        console.log("[UPLOAD] Starting file upload process...")
        const formData = await req.formData()
        const file = formData.get("file") as File | null

        if (!file) {
            console.log("[UPLOAD] No file provided in request")
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            )
        }

        console.log("[UPLOAD] File details:", {
            name: file.name,
            type: file.type,
            size: file.size
        })

        // Validate file type
        const validTypes = ["image/jpeg", "image/png", "image/webp"]
        if (!validTypes.includes(file.type)) {
            console.log("[UPLOAD] Invalid file type:", file.type)
            return NextResponse.json(
                { error: "Invalid file type. Only JPEG, PNG and WebP are allowed" },
                { status: 400 }
            )
        }

        // Convert to buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Create unique filename
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`
        const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
        
        // Get and verify upload directory
        const publicDir = join(process.cwd(), "public")
        const uploadDir = join(publicDir, "uploads")
        
        console.log("[UPLOAD] Directory paths:", {
            cwd: process.cwd(),
            publicDir,
            uploadDir
        })

        // Ensure public directory exists
        try {
            await access(publicDir, constants.W_OK)
            console.log("[UPLOAD] Public directory exists and is writable")
        } catch (err) {
            console.error("[UPLOAD] Public directory issue:", err)
            try {
                await mkdir(publicDir, { recursive: true })
                console.log("[UPLOAD] Created public directory")
            } catch (mkdirErr) {
                console.error("[UPLOAD] Failed to create public directory:", mkdirErr)
                throw new Error("Failed to create public directory")
            }
        }

        // Ensure uploads directory exists
        try {
            await access(uploadDir, constants.W_OK)
            console.log("[UPLOAD] Uploads directory exists and is writable")
        } catch (err) {
            console.error("[UPLOAD] Uploads directory issue:", err)
            try {
                await mkdir(uploadDir, { recursive: true })
                console.log("[UPLOAD] Created uploads directory")
            } catch (mkdirErr) {
                console.error("[UPLOAD] Failed to create uploads directory:", mkdirErr)
                throw new Error("Failed to create uploads directory")
            }
        }

        // Save file
        const filePath = join(uploadDir, filename)
        console.log("[UPLOAD] Attempting to write file to:", filePath)
        
        try {
            await writeFile(filePath, buffer)
            console.log("[UPLOAD] File written successfully")
        } catch (writeErr) {
            console.error("[UPLOAD] Failed to write file:", writeErr)
            throw writeErr
        }

        // Return the URL
        const imageUrl = `/uploads/${filename}`
        console.log("[UPLOAD] Success - returning image URL:", imageUrl)
        return NextResponse.json({ imageUrl })
    } catch (error) {
        console.error("[UPLOAD_ERROR] Full error details:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Error uploading file" },
            { status: 500 }
        )
    }
} 