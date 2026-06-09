import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {verifyToken} from "@/utils/auth"


export async function GET(request: NextRequest) {


  const profile = await prisma.user.findMany({where: {role:"USER"}, select: {
    id: true,
    email: true,
    username: true,
    avatar: true,
    favoriteTeams: {
      select: {
        id: true,
        name: true,
      }
    },
    role: true,
    posts: true,
    replies: true,
    threads: true,
    _count: {
      select: {
        followers: true,
        following: true,
      },
    }
  }})

  return NextResponse.json(profile)

}