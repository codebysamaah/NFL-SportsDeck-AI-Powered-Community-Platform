import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (payload.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

  const banappeals = await prisma.banAppeal.findMany({ 
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: {
        id:true,
        userId: true,
        reason:true, 
        createdAt: true,      
  }})


  return NextResponse.json(banappeals)

}