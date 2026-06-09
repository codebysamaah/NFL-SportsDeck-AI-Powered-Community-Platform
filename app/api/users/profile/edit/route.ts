import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {verifyToken} from "@/utils/auth"

export async function PUT(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { username, avatar, favoriteTeams } = await request.json();
  try{
  const currentUser = await prisma.user.findUnique({where: {id: Number(payload.userId)}})
  if(!currentUser){return NextResponse.json({error: "This is an invalid id"}, {status: 404})}

  const dataUpdate: {
    username?: string
    avatar?: string
    favoriteTeams?: { set: { id: number }[] }
    } ={ }
  if (username !== undefined) {dataUpdate.username = username}
  if (avatar !== undefined) {dataUpdate.avatar = avatar}
  if (Array.isArray(favoriteTeams)) {
      dataUpdate.favoriteTeams = {
          set: favoriteTeams.map(teamId => ({ id: Number(teamId) }))
      };
  }

  const updateUser = await prisma.user.update({where: {id: Number(payload.userId)}, data: dataUpdate, select: {
    email: true,
    username: true,
    avatar: true,
    favoriteTeams: {
        select: {
            id: true,
            name: true
        }
    },
    role: true
  }})
  return NextResponse.json(updateUser) 
}
  catch(e){  return NextResponse.json({error: "not updated"}, {status: 400})}
}