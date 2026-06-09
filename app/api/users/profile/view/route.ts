import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {verifyToken} from "@/utils/auth"


export async function GET(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })


  const profile = await prisma.user.findUnique({where: {id:Number(payload.userId)}, select: {
    email: true,
    id: true,
    username: true,
    avatar: true,
    is_banned: true,
    favoriteTeams: {
      select: {
        id: true,
        name: true,
      }
    },
    role: true,
    _count: {
      select: {
        followers: true,
        following: true,
      },
    },
    posts: { select: { id: true, content: true, createdAt: true } },
    replies: { select: { id: true, content: true, createdAt: true } },
    threads: { select: { id: true, title: true, createdAt: true } },
  }})

  return NextResponse.json(profile)

}