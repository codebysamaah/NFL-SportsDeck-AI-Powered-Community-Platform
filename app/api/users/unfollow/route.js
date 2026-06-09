import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {verifyToken} from "@/utils/auth"

export async function POST(request) {
    const token = request.cookies.get("access_token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })


    const followerId = payload.userId;

    const { targetId } = await request.json();

    if (!targetId || typeof targetId !== "number") {
        return NextResponse.json({ error: "Incorrect targetId, must be a number" }, { status: 400 });
    }

    if (followerId === targetId) {
        return NextResponse.json({ error: "You cannot unfollow yourself" }, { status: 400 });
    }
    try {
        const targetUser = await prisma.user.findUnique({ where: { id: Number(targetId) } });
        if (!targetUser) {
            return NextResponse.json({ error: "Target user not found" }, { status: 404 });
        }
        const existingFollow = await prisma.userFollow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: Number(followerId),
                    followingId: Number(targetId),
                },
            },
        });
        if (!existingFollow) {
            return NextResponse.json({ error: "Not following this user" }, { status: 400 });
        }

        const deleteResult = await prisma.userFollow.deleteMany({
            where: {
                followerId: Number(followerId),
                followingId: Number(targetId),
            },
        });

        if (deleteResult.count === 0) {
            return NextResponse.json({ error: "You were not following this user" }, { status: 400 });
        }
        return NextResponse.json({ message: "Successfully unfollowed user" });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}