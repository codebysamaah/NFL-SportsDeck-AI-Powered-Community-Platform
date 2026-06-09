import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {verifyToken} from "@/utils/auth"

export async function POST(request: NextRequest) {
    const token = request.cookies.get("access_token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const authPayload = verifyToken(token)
    if (!authPayload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({where: {id: Number(authPayload.userId)}, select: {is_banned:true}})
    if(!user){return NextResponse.json({error: "This is an invalid id"}, {status: 404})}
    if (!user.is_banned){return NextResponse.json({error: "User is not banned. Nothing to appeal"}, {status: 401})}

    const { reason  } = await request.json();

    if (reason === undefined ){
         return NextResponse.json({ error: "must have a reaason" }, { status: 401 })
    }

    const userId= authPayload.userId

    const banAppeal = await prisma.banAppeal.create({
        

        data: {
            userId,
            reason
        },
        select: {
            userId:true,
            reason: true
        },
        });

        return NextResponse.json(banAppeal);
    
    }
