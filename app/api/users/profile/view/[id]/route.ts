import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {verifyToken} from "@/utils/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const token = request.cookies.get("access_token")?.value
  const payload = token ? verifyToken(token) : null

  const user = await prisma.user.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      username: true,
      avatar: true,
      favoriteTeams: { select: { id: true, name: true } },
      posts: { select: { id: true, content: true, createdAt: true } },
      replies: { select: { id: true, content: true, createdAt: true } },
      threads: { select: { id: true, title: true, createdAt: true } },
      _count: { select: { followers: true, following: true } }
    }
  })

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  let isFollowing = false
  if (payload) {
    const follow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: payload.userId,
          followingId: Number(id)
        }
      }
    })
    isFollowing = !!follow
  }

  return NextResponse.json({ ...user, isFollowing })
}