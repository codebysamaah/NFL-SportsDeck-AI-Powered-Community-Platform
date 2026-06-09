import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth"; 

export async function GET(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value

  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const payload = verifyToken(token)  // no await
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

  return NextResponse.json({ userId: payload.userId, username: payload.username, role: payload.role })
}
