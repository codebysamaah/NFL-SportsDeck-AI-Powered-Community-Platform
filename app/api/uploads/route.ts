import { NextRequest, NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import path from "path"
import { verifyToken } from "@/utils/auth"

export async function POST(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get("file") as File
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const filename = `avatar_${payload.userId}_${Date.now()}.${file.name.split('.').pop()}`
  const filepath = path.join(process.cwd(), "public/uploads", filename)

  await writeFile(filepath, buffer)

  return NextResponse.json({ url: `/uploads/${filename}` })
}